# 0005: Mobile play and device preferences

- Status: Accepted
- Date: 2026-09-08

## Context

Players mainly use phones and need immediate access to the buzzer and buzz order.
The reviewed prototype gives these equal screen width and moves secondary actions
into a menu and participant drawer.

## Decision

Use PlayView for both live rooms and the isolated local prototype. RoomView adapts
live callbacks without assigning optimistic positions or changing server authority.
The live layout fills the viewport, scrolls the entire results half, and opens the
participant list in a modal bottom drawer occupying 70% of the screen. Host round
controls remain visible; ending the room requires confirmation from the host menu.
Connection failure, command errors, and host absence retain visible feedback.

Store handedness and explicit appearance choices in localStorage through browser
hooks. Appearance follows the system until the first toggle; thereafter the chosen
light or dark value takes priority. A nonce-protected bootstrap script restores the
choice before paint. Storage failure allows changes for the current page. Preference
values contain no identity, credentials, or room data.

## Consequences

One presentation serves both demonstrations and real games. Simulation remains
isolated in the prototype page; production commands still pass through useRoom and
the authenticated server adapter. Unit, workerd, Storybook, and multi-browser E2E
checks exercise these separate boundaries. There are no protocol, storage schema,
Durable Object migration, or deployment changes.

## References

- [Visual direction and interaction details](../design.md)
- [Room authority](0002-room-authority-and-lifecycle.md)
- [Testing scope](../testing.md)
