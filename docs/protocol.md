# Room protocol

Same-origin browser endpoints. Responses containing room state or capabilities
must never be cached. Errors are JSON: `{ code, message }`.

## HTTP

| Method / path                | Body              | Response                                        |
| ---------------------------- | ----------------- | ----------------------------------------------- |
| POST /api/rooms              | { name }          | 201 { code, you } + host cookie                 |
| POST /api/rooms/:code/join   | { name }          | 200 { room, you } + participant cookie          |
| GET /api/rooms/:code/session | —                 | 200 { room, you }, or 401 to show the name form |
| GET /api/rooms/:code/socket  | WebSocket upgrade | 101 and an initial snapshot                     |
| GET /health                  | —                 | { status: "ok" }; liveness only                 |

Names normalize to NFC, trim/collapse whitespace, and allow 1–24 Unicode code
points; invisible formatting/control characters are rejected. Names must be unique
case-insensitively in a room. Codes accept lowercase but normalize to six uppercase
symbols from ABCDEFGHJKLMNPQRSTUVWXYZ23456789.

The join endpoint also accepts `{ "spectator": true }` without a name. Spectators
have a separate 120-session limit and may join when the 60-player roster is full.
Their `you` identity is absent from `room.players`; spectator identities are never
listed in snapshots. Existing cookies reuse their original role. Spectator joins
do not extend expiry. Spectator sockets reject every game command with
`UNAUTHORIZED`, but receive snapshots, transport heartbeats, and room-end messages.

Cookies are scoped to /api/rooms/CODE. The body and URL never return the token.
HTTP errors include 400 invalid input, 401 missing membership, 403 origin/authority,
404 absent room, 409 name/capacity conflict, 410 expired room, 413 oversized body,
415 wrong media type, 426 missing upgrade, and 429 limits.

## WebSocket client messages

```json
{ "type": "buzz", "round": 1 }
{ "type": "reset", "round": 1 }
{ "type": "lock", "round": 1 }
{ "type": "end" }
```

Reset/lock/end require the host's authenticated membership. Reset increments the
round, clears results, and opens buzzing. Round zero waits for the host. Lock
preserves results. Every player may buzz once per open round, including the host.
Stale rounds are rejected; duplicate buzzes are acknowledged without a write.

Literal text `ping` receives `pong` via Cloudflare's auto-response API. These
messages do not extend room lifetime or run the JavaScript message handler.

## Server messages

```json
{
  "type": "snapshot",
  "you": "participant-id",
  "room": {
    "code": "ABC234",
    "round": 1,
    "status": "open",
    "players": [
      { "id": "participant-id", "name": "Sam", "isHost": false, "online": true }
    ],
    "buzzes": [{ "playerId": "participant-id", "position": 1 }],
    "expiresAt": 1788818400000
  }
}
```

Other envelopes:

```json
{ "type": "error", "code": "STALE_ROUND", "message": "The round changed. Try again." }
{ "type": "ended", "reason": "closed" }
```

Ended reasons are closed or expired. A snapshot contains no hashes or tokens.
Presence is advisory transport state, not proof a person is looking at their screen.

## Reconnection

The browser reuses its cookie and receives a complete authoritative snapshot.
It retries up to eight times with exponential backoff (500 ms to 15 s) plus
0–500 ms jitter. A failed upgrade probes the session endpoint to distinguish
lost membership and expired rooms. Online events can trigger an immediate retry.
Unmount cleans up sockets, timers, and listeners.

Commands are **never replayed** across reconnects. An eight-second confirmation
timeout tells the player their buzz may have arrived and offers reconnection.
Snapshots decide order; the client never guesses a position.

Close code 4004 means room end/expiry, 1008 means command-rate policy, and 1009
means oversized or binary messages. Policy failures expose a manual retry.
