# Host removal and room bans

Status: Accepted · Date: 2026-09-12

## Context

Hosts need to remove disruptive players through the player drawer, with a deliberate
second confirmation before an irreversible ban. Rooms have capability-cookie
identities and no accounts.

## Decision

Only the current host can send `remove` or `ban` commands targeting another player.
The drawer exposes one Remove link per other player. Its dialog offers Cancel,
Remove, and Ban. Ban opens a second confirmation: “Are you sure?” and
“There is no way to undo this.” There is no unban operation.

Both actions remove membership and the current buzz, compact the remaining buzz
positions, and free the name and seat. The room persists before notifying and
closing every socket for the target, including spectator tabs sharing that identity.
Removal allows explicit rejoining. Ban additionally stores the capability hash
privately until the room ends or expires and rejects session, socket, join,
spectator join, and leave requests using that identity. Rejecting leave also avoids
clearing a banned cookie through the ordinary departure endpoint.

An optional schema-v1 `bannedTokenHashes` list defaults to empty for existing rooms.
It is capped at 600 entries; once full, removal remains available but new bans fail
explicitly. Snapshots never include bans or hashes. Existing storage alarms clear
the list with the rest of the room. No server timers or polling are introduced.

## Consequences

Ban enforcement is limited to the browser capability. Clearing cookies, using a
different browser, or another device can bypass a ban. Names and IP addresses are
not identities and are not blocked. Stronger enforcement would require a separate
account/identity decision. The host cannot remove themselves; explicit departure
continues to handle host transfer.

## References

- [Capability identity](0003-capabilities-and-abuse-controls.md)
- [Explicit departure](0009-explicit-departure.md)
