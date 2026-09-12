# 0009: Explicit room departure

Status: Accepted · Date: 2026-09-11

## Context

Disconnected sessions deliberately retain seats for reconnection. Players need
an explicit way to free their seat and name, without waiting for room expiry.

## Decision

Add a same-origin authenticated POST /api/rooms/CODE/leave. Remove only the
identity authenticated by the cookie; never accept a target identity from the
browser. Persist removal before acknowledgement, clear the room cookie, and
notify and close every socket associated with that identity (close code 4005).
Departure is terminal in existing tabs, including spectator views of a player.
Closing a tab or losing connectivity continues to preserve the seat.

Remove the departing player's current buzz and renumber remaining results in
their original arrival order. Keeping only active players and their buzzes keeps
state bounded even with repeated leave/rejoin cycles. The confirmation explains
that the seat and current buzz are removed and all shared tabs leave.

If the host leaves, promote the earliest-joined remaining player. If the final
player leaves, close the room and notify spectators. Spectators can also leave,
freeing their separate session capacity. Departure does not extend room expiry.

## Consequences

The 60-player and 120-spectator limits now bound current membership rather than
lifetime seats. A departed name is immediately available, and returning creates
a fresh identity. A host may explicitly end the room instead of handing it off.
The browser only clears its view after server confirmation; failed requests keep
the current view and offer another attempt.
