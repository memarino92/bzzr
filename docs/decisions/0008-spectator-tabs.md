# 0008: Spectator views belong to tabs

Status: Accepted · Date: 2026-09-11

## Context

Hosts and players need to project results while continuing to play in another
tab. Requiring a separate browser profile adds unnecessary setup.

## Decision

Extend ADR 0007 with /room/CODE/spectate as an explicit display route. Everyone
with a player menu can open it in a new tab. Existing sessions retain their
identity and permissions; this route renders only results and status, and its
browser hook does not send game commands. The original tab remains interactive.

Direct visitors without a session automatically obtain the existing nameless
spectator capability. Join-as-spectator actions navigate to this route too.

## Consequences

Display mode survives refresh and sharing, without local-storage flags or changes
to shared cookies. Player-backed display tabs count toward that player's existing
three-socket limit and do not use spectator capacity. This display choice is not
an authorization boundary: the server continues to enforce the cookie identity's
permissions. Actual spectator identities remain unable to issue game commands.
