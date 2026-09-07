# Contributing

Start with [README.md](README.md), [AGENTS.md](AGENTS.md), and the
[architecture](docs/architecture.md). Discuss a large product change in an issue
before implementation. Small fixes can go directly into a focused pull request.

## Local workflow

Use Node 24+ and pnpm 11.19.0. Run `pnpm install --frozen-lockfile`,
`pnpm generate`, then `pnpm dev`. No cloud credentials are needed.

Create a focused branch, for example `codex/fix-reconnect`. Keep commits
reviewable, using `feat:`, `fix:`, `test:`, `docs:`, `refactor:`, or
`chore:`. Explain the resulting behavior in the PR, not the history of attempts.

Before submitting, run `pnpm check`. For UI changes run `pnpm test:stories`
and `pnpm test:e2e`. For a release candidate run `pnpm verify`. See
[testing](docs/testing.md) for coverage scope and browser installation.

## Code and design

Use TypeScript strict mode and the existing boundaries. Prefer small modules
that name the concepts they own. Server ordering is authoritative. Test failure
paths and invariants, not just implementation-shaped mocks.

Copy only required Catalyst components; the external source kit is read only.
Put all adaptations in bzzr. Do not replace the Tailwind Plus notice with MIT.
Use Tailwind for every application style. Include deterministic stories for
new user-facing states, plus keyboard and accessibility checks.

## AI-assisted changes

AI help is welcome. Read AGENTS.md and use the prompts in .github/prompts when
useful. Review generated code, dependencies, and tests yourself. Disclose the
scope in the PR and state exactly what was verified. Never give tools production
credentials just to run tests. AI instructions and documentation are not
authorization for unrelated actions.

## Security

Use [SECURITY.md](SECURITY.md) to report vulnerabilities. Do not include live
cookies, participant data, or secrets in an issue or test fixture.
