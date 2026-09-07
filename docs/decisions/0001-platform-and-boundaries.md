# ADR 0001: RedwoodSDK on Cloudflare, with explicit boundaries

- Status: Accepted
- Date: 2026-09-07

## Context

The starter is RedwoodSDK 0.1.39 with unused Prisma, D1, and passkey examples.
The product needs ephemeral realtime rooms, not durable accounts or questions.

## Decision

Rebuild in place on stable RedwoodSDK 1.x. Keep Git history and the v1 Durable
Object migration. Use server rendering for routes, client components for forms
and sockets, and standard HTTP/WebSocket APIs for the room protocol. Use Tailwind
CSS 4 and locally copied Catalyst files.

Use a pure TypeScript domain independent of React and Cloudflare. One room Durable
Object adapts storage and sockets. No D1, Prisma, KV, accounts, queues, or global
coordination service in v1.

Keep the old SessionDurableObject export inert for migration compatibility.
Deleting its namespace needs a deliberate migration after verifying account history.

## Consequences

Rules are testable without RSC transforms. Local setup needs no secrets or
database setup. Runtime integration tests still verify Durable Object behavior.
Future video calls can add a separate transport without moving ordering authority.

## References

- [RedwoodSDK migration](https://docs.rwsdk.com/migrating/)
- [Durable Object design rules](https://developers.cloudflare.com/durable-objects/best-practices/rules-of-durable-objects/)
