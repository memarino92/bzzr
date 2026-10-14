# Error monitoring across execution boundaries

Status: Accepted · Date: 2026-10-13

## Context

Server logs cannot expose browser rendering/hydration failures. A request wrapper
also misses exceptions converted into friendly HTTP or WebSocket responses.
Rooms use hibernating sockets and capability identities that must not enter
telemetry. Deployment belongs to Cloudflare Workers Builds.

## Decision

Use `@sentry/react` before RedwoodSDK hydration and its three React error hooks.
Wrap the Worker and BuzzerRoom separately with `@sentry/cloudflare`. Capture
unexpected errors in existing catches, excluding `RoomError`. Keep SDK imports
outside the domain. Use per-invocation server clients and SDK-managed `waitUntil`
flushes; no telemetry timers or awaited external I/O enter room transitions.

Runtime DSNs/environment/release are optional environment bindings. Render only
the browser's public configuration as escaped meta tags and allow its ingestion
origin in CSP. Preserve dashboard text variables during deploys. Browser and
server projects are separate by default; Worker/room share one project.

Rebuild outbound error events with an allowlist. Keep stack locations, standard
error types, debug IDs and approved tags. Replace error messages and omit all
request/user/payload/React context. Disable breadcrumbs, sessions, logs, replay and
tracing. Preserve Cloudflare metrics for transport/platform health.

The deploy build uploads hidden source maps to both projects using a build-only
CI token. Debug IDs support mapping; the build commit provides a common release.
Delete client maps after the build, including builds without uploads. CI tests
and local use remain functional without credentials. Detailed account setup,
notification rules, privacy, rotation and verification live in [the runbook](../sentry.md).

## Consequences

Error stacks identify code but lack arbitrary messages and user context. New data
collection requires an explicit policy change. Direct browser ingestion exposes
the public DSN and network metadata to Sentry; account retention/rate limits and
alerts require manual configuration. Capture tests cannot prove account delivery.
Real workerd tests run with active instrumentation to check hibernation and alarms.
No protocol/schema or Cloudflare migration changes are needed.

## Primary sources

- [React error hooks](https://sentry.io/changelog/react-19-support/)
- [Cloudflare SDK implementation](https://github.com/getsentry/sentry-javascript/tree/develop/packages/cloudflare)
- [Vite source-map plugin](https://github.com/getsentry/sentry-javascript-bundler-plugins/tree/main/packages/vite-plugin)
- [Workers Builds variables](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)
