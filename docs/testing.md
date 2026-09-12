# Testing

## Commands and claims

| Command               | What it verifies                                                             |
| --------------------- | ---------------------------------------------------------------------------- |
| pnpm check            | TypeScript, lint, formatting, unit/components, workerd integration           |
| pnpm test:coverage    | V8 coverage for pure rules, HTTP helpers, UI, hooks and browser transport    |
| pnpm test:integration | Production API/DO in real workerd, including eviction/hibernation and alarms |
| pnpm test:stories     | Storybook states/interactions in Chromium with accessibility checks          |
| pnpm test:e2e         | Builds production app, then runs independent host/player browser journeys    |
| pnpm storybook:build  | Generates standalone static Storybook                                        |
| pnpm verify           | All of the above checks needed for a release candidate                       |

Install Chromium once with `pnpm exec playwright install chromium`.
Linux CI uses `pnpm exec playwright install --with-deps chromium`.

## Test layers

Unit tests cover role checks, server ordering, duplicates, stale rounds, name/code
validation, idle and absolute expiry, response redaction, bounded JSON, cookies,
and token hashing. Components cover semantic controls, keyboard input, inline
errors, clipboard fallback, and end-room confirmation. Hook/transport tests cover
cleanup, acknowledgement timeout, reconnect backoff, stale recovery races, and
the rule that buzzes are never replayed.

Integration tests import the actual server adapter into a test-only Worker entry.
They verify real socket broadcasts, persisted order, host authority, restored
attachments after eviction, alarms/deleteAll, parallel joins at capacity, heartbeat
auto-responses, command/connection bounds, and request throttling. They do not
mock Durable Object storage. They never expose a test endpoint in production.

E2E uses the built RedwoodSDK app through Vite preview. Three independent browser
contexts represent host and two guests. Tests exercise links, code entry, cookies,
hydration, CSP, order, reset, lock, reload, offline/online recovery, keyboard use,
room end, invalid rooms, and automated accessibility. Browser journeys against Storybook examples also cover
24 players with long names, full-height results scrolling, modal drawers, clipboard
fallback and handedness. Live-room journeys cover saved handedness, short-wide buzzer containment, and system versus explicit appearance preferences. Desktop and mobile Chromium
configurations run; mobile emulation is not a physical-device or Safari test.

The E2E runner starts both the built app and a local Storybook server.
Fixed Storybook viewports also run in the story test runner, including geometric
assertions that the buzzer stays inside its panel in short, wide windows.

Storybook is deterministic and has no production room access. The playable story
demonstrates UI transitions; it is not a networking test. Axe checks are useful
automation, not a substitute for screen-reader and touch-device review.

## Coverage and artifacts

Spectator integration cases fill all 60 player slots, join without a name, restore
sockets after real eviction, reject buzz/reset/lock/end commands, and verify the
separate spectator cap without extending expiry. Browser journeys cover nameless
entry, live results/status, refresh, and the full-URL QR modal. Storybook includes
spectator waiting/open/closed/results/reconnection, full rosters, mobile layouts,
simulated incoming results, nameless entry validation, and QR dismissal/focus.

Thresholds: at least 80% statements/functions/lines and 75% branches for the
node/browser-unit scope in vitest.config.ts. The Worker API and DO adapters are
tested in workerd, outside that V8 percentage. The copied Catalyst vendor files,
stories, generated types, and build configuration are not part of this metric.

Open coverage/index.html and playwright-report/index.html after local runs.
CI uploads coverage, browser traces/screenshots, and a standalone Storybook.
Recordings can contain test names; fixtures use invented names only.

## Baseline

The initial implementation was verified locally on Windows with Node 26, using
the pinned Node 24-compatible dependencies. The committed CI uses Node 24 on Linux.
Local success does not mean the GitHub jobs have already run.

This suite has not benchmarked large numbers of geographically distributed rooms.
Capacity and minimum-cost claims require a staged load exercise and measured
Cloudflare usage. See operations.md.
