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
