# ADR 0003: Accountless capabilities and bounded resources

- Status: Accepted
- Date: 2026-09-07

## Decision

Treat a room code as a public invitation. Give each browser a random 256-bit
capability via an HttpOnly, SameSite=Strict cookie, Secure on HTTPS. Scope it to
the room API path and store only SHA-256. Room role is server-owned. No bearer
tokens in localStorage, links, query parameters, or public snapshots.

Require exact Origin on POSTs/upgrades. Validate JSON, names, codes, and commands.
Use 1 KiB HTTP bodies, 512-byte WebSocket messages, 60 lifetime seats per room,
three sockets per participant, and 20 commands per ten seconds per socket.
Cloudflare rate-limit bindings allow ten creates and 120 room API requests per
minute per edge IP key. Keep cookie-free sharing separate from authorization.

## Consequences

There is no account database, login ceremony, or recurring identity service cost.
The host can refresh without losing authority; a shared link cannot grant it.
Multiple rooms can coexist in one browser using separate cookies.

Cookie loss has no recovery. Tabs in one browser profile share identity, so tests
use separate browser contexts for different players. Shared networks can exhaust
an IP quota. Edge rate limits are local to a Cloudflare location, not a globally
consistent abuse ledger; distributed attacks need additional edge controls.

We do not ship CAPTCHA, IP logging, or per-IP Durable Objects by default.
They would add friction, data, and cost. Revisit with measured abuse.
