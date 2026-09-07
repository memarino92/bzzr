# ADR 0004: Test at the boundary being claimed

- Status: Accepted
- Date: 2026-09-07

## Decision

Use Vitest for pure rules, HTTP helpers, components, hook state, and transport
timers; Cloudflare's workerd pool for the actual API/DO; Storybook browser tests
for visual states, interactions, and accessibility; and Playwright for full
multi-browser journeys against the production build.

The integration entry imports the same production server adapter but avoids
RedwoodSDK RSC transforms. No test routes or debug backdoors ship in production.
E2E tests cover the built RedwoodSDK document, cookies, CSP, hydration, and sockets.

Keep portable AGENTS.md as the AI source of truth. Thin editor instructions and
task/review prompts link to it. CI is the executable check, not claims in generated
documentation. Require human review for deployment and architectural decisions.

Pin compatible packages and the lockfile. Pin GitHub Actions to reviewed commit
SHAs and use Dependabot for updates. As of bootstrap, TypeScript 5.9 and ESLint 9
are retained for the installed ecosystem's peer compatibility; upgrade them as a
validated group. Current stable framework versions do not imply every supporting
tool should be upgraded past its peers.

## Consequences

The suite costs more setup than a single mock-based test runner, but verifies
the platform behaviors that matter. The node coverage report excludes the Worker
runtime adapters; they are tested in workerd and reported separately. Passing
local tests is not evidence of globally distributed load capacity.
