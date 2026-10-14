# Sentry setup and operations

bzzr reports unexpected errors from three execution boundaries: browser React and
JavaScript, the RedwoodSDK Worker (HTTP and server rendering), and each BuzzerRoom
Durable Object (HTTP, initialization RPC, hibernating WebSocket callbacks, alarms).
Reporting is optional. Missing or invalid DSNs disable the corresponding boundary.
Local development, Storybook, and ordinary GitHub CI require no Sentry credentials.

## 1. Create Sentry projects

In your Sentry organization, create a React project named `bzzr-browser` and a
Cloudflare Workers project named `bzzr-server`. Both server boundaries share the
server project; their `boundary` tags distinguish `worker` and `room`. Two projects
keep browser noise and server failures independently configurable. You can use one
project instead by supplying the same DSN and project slug in both settings.

For each project, open Settings → Projects → project → Client Keys (DSN) and copy
the public HTTPS DSN. A modern DSN looks like
`https://PUBLIC_KEY@o123.ingest.us.sentry.io/456`. Do not use a legacy DSN with a
password. DSNs authorize event submission, not account access; the browser DSN is
intentionally visible in the rendered document and network requests.

Set project retention, quotas/rate limits, and inbound filters to suit your account.
In the browser project's security settings, restrict allowed domains to your own
production/preview hosts. Domain filtering reduces accidental submissions; a public
DSN is not authentication against a determined sender.

## 2. Configure Cloudflare runtime variables

Open Workers & Pages → **bzzr** → Settings → Variables and Secrets. These are
Worker runtime settings, separate from Workers Builds variables in the next step.
Add the following as text variables:

| Variable             | Value                   | Required for                            |
| -------------------- | ----------------------- | --------------------------------------- |
| `SENTRY_DSN`         | DSN from `bzzr-server`  | Worker and room reporting               |
| `SENTRY_BROWSER_DSN` | DSN from `bzzr-browser` | Browser reporting                       |
| `SENTRY_ENVIRONMENT` | `production`            | Correct production filtering and alerts |
| `SENTRY_RELEASE`     | Normally leave unset    | Optional release override               |

Save/apply the settings using Cloudflare's deployment flow. New browser documents
receive the current public DSN, environment, and release in escaped meta tags.
Only those public values are rendered; the server DSN is not included in the
document. Existing browser tabs keep their configuration until a page reload.
Existing Durable Object instances use configuration from their deployed version;
do not assume dashboard edits hot-reconfigure active rooms. Finish a deployment
and verify new rooms after changing settings.

The repository uses `keep_vars: true` and does not declare empty Sentry runtime
values in Wrangler. Deploys preserve the dashboard's text variables. If you later
move these values into Wrangler `vars`, those declared values take precedence.
Use separate settings and projects, or a distinct `preview` environment, for
preview Workers. Never route preview room bindings to production namespaces.

## 3. Configure source-map uploads in Workers Builds

Create a Sentry organization auth token for CI/source-map publishing with `org:ci`
permissions and access to both projects. Follow the current Sentry token UI; this
token is a secret. If using a personal token instead, use Sentry's documented
release-upload permissions and ensure access to both projects.

In **bzzr → Settings → Build → Build variables and secrets**, add:

| Build variable           | Value                                   | Secret? |
| ------------------------ | --------------------------------------- | ------- |
| `SENTRY_AUTH_TOKEN`      | CI publishing token                     | **Yes** |
| `SENTRY_ORG`             | Organization slug from Sentry's URL     | No      |
| `SENTRY_PROJECT`         | `bzzr-server` project slug              | No      |
| `SENTRY_BROWSER_PROJECT` | `bzzr-browser` project slug             | No      |
| `SENTRY_RELEASE`         | Usually omit; optional explicit release | No      |

Keep the existing install/build/deploy commands: `pnpm install --frozen-lockfile`,
`pnpm build`, and `pnpm exec wrangler deploy`. Only the deploy build needs this
token. **Do not add it to runtime settings, `.dev.vars`, `VITE_*` variables, or Git.**
GitHub's validation jobs need no Sentry secrets and do not upload maps.

Cloudflare automatically supplies `WORKERS_CI_COMMIT_SHA` to builds. The build uses
`SENTRY_RELEASE`, then that commit SHA, as its release identifier, embeds the same
public identifier for both runtime boundaries, and passes it to Sentry's Vite
plugin. No manual release update per deployment is needed. If you deliberately
set a runtime release override, keep it equal to the build release. For manual
builds outside Workers Builds, set `SENTRY_RELEASE` to the commit being deployed.

When `SENTRY_AUTH_TOKEN` is present, all three project/organization settings are
required. The Vite plugin injects debug IDs and uploads JS/source maps to both
projects. Upload errors fail the build. Without a token, builds succeed without
uploads, so check that the deploy build is actually configured before relying on
readable production stacks. The post-build script removes client `.map` files
even for builds without credentials; hidden source maps alone do not prevent
public access. Worker maps remain available for Wrangler's platform diagnostics.

## 4. Configure notifications

For **each project**, create error alerts restricted to `environment:production`:

1. Notify your email when a new issue appears.
2. Notify when a resolved issue regresses.
3. Set a repeat interval, for example one notification per issue per hour, to avoid
   an inbox flood. Add an event-volume rule later if traffic warrants it.
4. Confirm the recipient/team and enable notification delivery in your personal
   notification settings. Connect Slack separately only if you want that channel.
5. Exercise the rule's test/preview facility and confirm a notification arrives.

Rules, email verification, recipients, quotas, and retention are account settings;
deploying this repository cannot configure or verify them automatically.

## Local testing

Copy `.dev.vars.example` to `.dev.vars`, enter DSNs for development projects, keep
`SENTRY_ENVIRONMENT=development`, and restart `pnpm dev`. Leave the file absent or
the DSNs empty for normal offline development. `.dev.vars` is ignored by Git.
Source-map upload settings belong to the build process, not this file.

## 5. Verify after deployment

1. Open the production site with browser developer tools. Check the `sentry-*`
   meta tags: the browser DSN and `production` should be present, and release
   should match the deployed commit. No API token or server DSN should appear.
2. Create and join a disposable room, buzz, reset, reconnect, and end the room.
   Ordinary domain errors and disconnects should not create error issues.
   To check basic browser ingestion in staging, execute
   `setTimeout(() => { throw new Error("bzzr telemetry smoke test"); }, 0)` in the
   browser developer console. Confirm the envelope POST succeeds and a browser
   issue arrives with the original smoke-test message;
   a console-generated stack cannot prove source maps for an app bundle.
3. In an internal staging deployment configured with separate Sentry projects,
   temporarily add controlled exceptions to the browser, Worker, and room command
   path. Verify one event per exercised path, `boundary`/`operation` tags, mapped
   source locations, release/environment, and the configured notification. Remove
   those exceptions before promoting the release. There is no public debug-crash
   endpoint in production.
4. Inspect event JSON for excluded data. Confirm cookies, capability hashes, room
   codes, names, snapshots, request bodies, and query strings are absent. Confirm
   useful diagnostic messages and exception types are preserved. Try a `.js.map`
   URL for a client bundle: it must not serve a map.
5. If no events arrive, check DSNs, environment filtering, project quotas, browser
   blockers, and the CSP/network panel. The app permits only the configured
   browser DSN's HTTPS origin in `connect-src`; do not add a wildcard.

Automated tests use the actual browser SDK and instrumented workerd handlers with
fake outbound delivery. The existing integration suite runs with reporting enabled
and exercises real eviction, restored sockets, and alarms. These tests do not prove
delivery to your Sentry organization, successful authenticated uploads, or email
delivery; those require the account checks above.

## Data policy and limitations

Errors retain their diagnostic message, custom exception type, mechanism, stack
function/file/line/column, debug IDs, release, environment, and boundary/operation
tags. For example, `Cannot read properties of undefined (reading 'buzzes')` and
`SQLITE_BUSY: database is locked` remain intact. Recognizable credential fields,
bearer tokens, capabilities/hashes, cookie headers, and URL credentials/query strings
are scrubbed within messages instead of replacing the whole message.

HTTP method, sanitized request URL, User-Agent and selected browser/OS/runtime/device
model/version context are retained for diagnosis. Room URL segments become `[room]`.
Request bodies, cookies/authorization headers, user identifiers, IP fields, device
names, React props/component context, source excerpts, arbitrary extra context,
and automatic breadcrumbs are omitted. Do not interpolate private names, credentials
or full payloads into exceptions: patterns cannot recognize arbitrary unlabeled
private text. See [ADR 0012](decisions/0012-useful-error-diagnostics.md).
Session tracking, Session Replay, application logs, and sampled tracing are off.
Sentry still receives network connection metadata when browsers contact it directly;
configure server-side IP retention/scrubbing and retention policy in Sentry as needed.

Known `RoomError` outcomes are omitted from explicit capture. Browser exceptions
and unexpected caught API/room exceptions are reported. A WebSocket error event
without an exception, ordinary retries, and exhausted retries alone do not create
an issue. Keep Cloudflare metrics for disconnect rates, CPU/storage, and invocation
failures. `/health` is liveness; telemetry cannot report every outage, especially
when scripts fail to load, a browser blocks delivery, or the platform kills a Worker.

Telemetry never participates in a domain transition or waits before acknowledging a
buzz. Sentry's Cloudflare wrappers isolate invocation state and flush with
`waitUntil`. No server intervals, socket listeners, or polling are added. SDK flush
work may briefly extend an errored invocation; it does not require keeping idle
rooms alive. Cloudflare migrations and room protocol/storage schema are unchanged.

## Disable, rotate, and roll back

Clear/remove `SENTRY_BROWSER_DSN` to disable browser reporting on the next page
reload, or `SENTRY_DSN` to disable Worker/room reporting after applying the new
deployment. Invalid DSNs also disable reporting. Clear both to disable all reporting.
Revoke old client keys in Sentry when rotating them; update runtime values and
reload/verify. Revoke/replace `SENTRY_AUTH_TOKEN` in the build secret store separately.
Removing the build token disables future uploads but leaves runtime reporting active.

Roll back using the existing Cloudflare deployment history procedure. Settings and
Sentry project data have their own lifecycle; app rollback does not delete events
or undo alert configuration. The room TTL does not delete Sentry events.

## References

- [Sentry React 19 error hooks](https://sentry.io/changelog/react-19-support/)
- [Sentry Cloudflare SDK](https://github.com/getsentry/sentry-javascript/tree/develop/packages/cloudflare)
- [Sentry Vite plugin](https://github.com/getsentry/sentry-javascript-bundler-plugins/tree/main/packages/vite-plugin)
- [Sentry token permissions](https://docs.sentry.io/api/permissions/)
- [Cloudflare Workers Builds configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)
- [Cloudflare runtime variables](https://developers.cloudflare.com/workers/configuration/environment-variables/)
