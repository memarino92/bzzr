# Initial verification record

Date: 2026-09-07. Environment: Windows, Node 26.8.1, pnpm 11.19.0.
This records observed local results, not a claim that GitHub CI or production
deployment has run. CI is configured for Node 24 on Linux.

## Executed successfully

- pnpm verify: types, lint, formatting, unit/components, real workerd integration,
  coverage, production build, Playwright journeys, static Storybook, and its
  Chromium interaction/accessibility tests.
- 82 unit/component tests.
- 18 workerd integration tests.
- 29 Storybook browser tests.
- 4 Playwright journeys across desktop and mobile Chromium.
- Cloudflare deployment dry run, with the generated Worker config and all bindings.
- Local Markdown link check and git diff --check.

V8 coverage in the configured unit/component scope:

| Metric     | Result |
| ---------- | ------ |
| Statements | 94.85% |
| Branches   | 90.11% |
| Functions  | 94.50% |
| Lines      | 96.74% |

The Worker API and Durable Object adapter are covered by separate runtime tests,
not included in those percentages. The suite verifies actual eviction with open
hibernating sockets, reconstruction of authority, alarm cleanup, and concurrent
capacity enforcement.

## Review artifacts

The [home screenshot](images/home.png) and [room screenshot](images/room.png) show
the locally built app with invented participant names. The sample room was ended
after capture. Neither screenshot contains a participant capability.

Open Storybook locally with pnpm storybook, or download the static Storybook
artifact after CI runs.

## Limits

No geographically distributed load test, physical-device test, Safari/Firefox
run, screen-reader review, or production-account inspection was performed.
The production Worker/domain and migration history must be checked before release.
The code has not been pushed or deployed as part of this implementation.
