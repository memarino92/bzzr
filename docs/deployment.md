# Deployment

Production is intended for **bzzr.app** and its existing Cloudflare Git integration.
The repository does not contain account credentials or an additional auto-deploy
workflow. CI validates and builds; Cloudflare remains the deployment owner.

## One-time account check

The original starter had placeholder names and a v1 SessionDurableObject migration.
The current Worker name is bzzr. Before the first production release, verify in
Cloudflare that this matches the already-connected Worker and custom domain.
Keep the existing domain association; do not provision a second worker accidentally.

Wrangler history preserves v1 and adds v2 for BuzzerRoom. Confirm the account's
migration history before applying it. Do not delete or retag migrations.
The inert legacy export preserves compatibility and does not delete old storage.
If that namespace has real data, retirement needs a separately reviewed migration.

No D1 database, KV namespace, R2 bucket, or secret is required. The ROOMS binding
and rate-limit bindings are declared in wrangler.jsonc. The chosen compatibility
date, 2026-08-01, is supported by both pinned production and test runtimes.

## Connected build settings

Use the repository root, Node 24+, and pnpm 11.19.0. The install command is
`pnpm install --frozen-lockfile`. Choose one configuration:

| Cloudflare setting                  | Command                   |
| ----------------------------------- | ------------------------- |
| Build                               | pnpm build                |
| Deploy                              | pnpm exec wrangler deploy |
| Alternative combined deploy command | pnpm release              |

Do not run both the split build and the combined release command; that builds
twice. Vite writes the deployment configuration and assets to dist. Wrangler uses
the Vite-generated deployment configuration via .wrangler/deploy/config.json.

Run `pnpm verify` before release. CI does not require Cloudflare credentials and
contains no deploy token. Protect main and require both CI jobs before production
releases; configure that policy in GitHub/Cloudflare, not only in this document.

## Storybook hosting

Storybook uses a separate static-assets Worker, `bzzr-storybook`, configured in
`wrangler.storybook.jsonc`. This keeps the component workshop independent of the
game Worker and its room storage. It serves the existing `storybook-static/` build
without a Worker script, bindings, or migrations. Cloudflare owns deployment through
its Git integration; GitHub CI continues to validate and retain the static artifact.

In the Cloudflare dashboard, create/connect `bzzr-storybook` to this repository
using these Workers Builds settings:

| Setting                              | Value                                                                  |
| ------------------------------------ | ---------------------------------------------------------------------- |
| Production branch                    | `main`                                                                 |
| Root directory                       | Repository root                                                        |
| Node / pnpm                          | Node 24+ / pnpm 11.19.0                                                |
| Build command                        | `pnpm install --frozen-lockfile && pnpm storybook:build`               |
| Deploy command                       | `pnpm exec wrangler deploy --config wrangler.storybook.jsonc`          |
| Non-production branch deploy command | `pnpm exec wrangler versions upload --config wrangler.storybook.jsonc` |

The non-production command is needed only if branch preview builds are enabled.
Always select the explicit Storybook config: the default config deploys the game,
and its Vite build can also leave a generated deployment config behind.

The Storybook config declares `storybook.bzzr.app` as a custom domain. Before the
first deployment, confirm that `bzzr.app` is an active zone in the same Cloudflare
account and resolve any conflicting DNS record for that hostname. Cloudflare
provisions the custom-domain DNS record and TLS certificate during deployment.

Run `pnpm generate` and `pnpm check` after configuration changes. Before publishing,
run `pnpm verify`. To validate the Storybook deployment bundle without publishing:

```sh
pnpm storybook:build
pnpm exec wrangler deploy --config wrangler.storybook.jsonc --dry-run
```

After the dashboard deployment, check `https://storybook.bzzr.app`, a direct story
link, the Docs view, and the playable local round. The stories use simulated room
state. Preserve the Catalyst notice and the application-only scope described in
[third-party notices](../THIRD_PARTY_NOTICES.md).

See Cloudflare's [Workers Builds settings](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)
and [custom-domain setup](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/).

## Manual deployment

After authenticating with the intended Cloudflare account, use `pnpm release`.
This changes production. Local development, preview, tests, and Storybook do not.

For an additional non-publishing bundle check:

```sh
pnpm build
pnpm exec wrangler deploy --dry-run
```

## Post-release smoke check

Check /health, create a disposable room, join from a separate browser profile,
open buzzing, submit two buzzes, compare order, refresh a player, reset, and end
the room. Check Cloudflare errors and storage cleanup. Never use production as a
load-test target without a specific budget and operational plan.

## Rollback

Use Cloudflare's deployment history to restore the last known-good Worker only
when its code understands the current schema and class migrations. A code rollback
does not reverse a Durable Object migration. For incompatible state changes,
prefer a forward fix. Notify active rooms before maintenance when feasible.

Fresh preview environments need separate Worker names, bindings, and domain
settings; do not point a preview app at production room namespaces.
