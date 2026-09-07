# ADR 0002: One ephemeral authority per room

- Status: Accepted
- Date: 2026-09-07

## Decision

Route six-character, cryptographically random codes directly to named SQLite
Durable Objects. Creation checks collisions at the destination and retries.
There is no global registry, KV consistency window, or singleton bottleneck.

The room persists a versioned, bounded snapshot containing at most 60 people,
their hashed capabilities, and the current round's ordered buzz list.
The host is also a participant. New rooms wait until the host opens round one.
Reset clears results and opens the next round. Lock preserves the current results.

The server assigns positions in message arrival order; client timestamps never
influence priority. Every round command carries the round the client observed.
A stale command is rejected, including duplicate reset clicks. One accepted buzz
per participant per round is idempotent. This is arrival-order fairness, not a
claim of equal network latency or suitability for high-stakes tournaments.

Use the WebSocket Hibernation API and serialized attachments for identity and
message rate limits. Ping/pong auto-responses maintain transport health without
waking a room. No periodic server timers or polling.

Successful joins and changed game state extend a two-hour idle expiry; reads,
reconnects, duplicates, and pings do not. An absolute 24-hour cap always applies.
Alarms close sockets and deleteAll storage. End room performs the same cleanup.
Retain only the current round, not an event history.

## Tradeoffs

A 60-seat lifetime roster bounds memory and fan-out; disconnected seats persist
so returning players keep identity and position. Cookies are device-local, with
no account recovery or host transfer. A lost host cookie requires a new room.
A code can be reused after expiry; old cookies have no authority in the new room.

The state object uses SQLite-backed KV storage for simplicity and atomic bounded
writes. A row-per-player SQL schema is unnecessary at this scale per room.
Scale comes from independent rooms, not an unbounded single room.

## References

- [Hibernating WebSockets](https://developers.cloudflare.com/durable-objects/best-practices/websockets/)
- [Storage cleanup](https://developers.cloudflare.com/durable-objects/best-practices/access-durable-objects-storage/)
- [Alarms](https://developers.cloudflare.com/durable-objects/api/alarms/)
