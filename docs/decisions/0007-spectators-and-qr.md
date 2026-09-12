# 0007: Spectators and QR invitations

Status: Accepted · Date: 2026-09-11

## Context

Projection needs a nameless results view even when all 60 player slots are filled.
In-person invitations benefit from a large QR code encoding the full room URL.

## Decision

Store up to 120 separate spectator capabilities per room, outside the player roster.
The optional spectators field is an additive schema-v1 extension; old records
default to an empty list. Existing capability identities are reused on repeated
joins, preserving host/player roles and avoiding accidental role changes.
Spectators authenticate with the same private cookie and bounded hibernating
WebSockets. Only roster members can execute domain commands. Spectators never
extend the room lifetime, appear in snapshots, or consume player capacity.
Their display uses the absence of their server-issued identity in the roster to
select a results-only view; authorization always stays on the server.

Generate invitation QR codes locally with qrcode.react, using the current origin
and canonical /room/CODE path, without query strings or credentials. Use a
high-contrast white panel and four-module quiet zone, with an accessible modal.
Do not use the deprecated, nonstandard browser brightness API.

## Consequences

Spectator sessions resume on reload and survive object eviction. A separate cap
bounds storage and fanout; abandoned identities last until room cleanup, just as
player identities do. Changing between spectator and player identities is outside
this feature. Read-only spectators cannot keep an otherwise idle room alive.
The QR code works in dark mode but device brightness remains under user control.

Sources: [MDN brightness](https://developer.mozilla.org/en-US/docs/Web/API/Screen/mozBrightness),
[qrcode.react](https://github.com/zpao/qrcode.react).
