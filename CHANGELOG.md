# Changelog

Changes follow Conventional Commits. This log records user-visible milestones.

## 1.0.0 — Unreleased

- Let hosts and players open a spectator tab without changing their playing session.

- Add a large QR invitation modal to the room menu.
- Add nameless spectator entry and a projection-friendly live results view, with separate capacity from players.

- Promote the phone-first play prototype to live host and player rooms.
- Add a 90s-inspired visual style, a participant drawer, and a host-only end action in the room menu.
- Remember handedness and explicit light/dark choices on the device, defaulting appearance to the system.
- Add b. favicons and generic social sharing cards.

- Replace the dormant starter with RedwoodSDK 1, React 19, and Tailwind CSS 4.
- Add accountless host/player rooms with six-character codes and copyable invites.
- Record authoritative buzz order with reset, lock, and end controls.
- Persist membership across refreshes and recover temporary disconnections.
- Use hibernating Durable Object sockets, bounded resources, and expiry cleanup.
- Add copied Catalyst components, responsive UI, and keyboard/accessible states.
- Add Storybook, domain/component/runtime/browser tests, coverage gates, and CI.
- Document architecture, protocol, operations, deployment, AI workflow, and decisions.
- License original code under MIT; preserve the Tailwind Plus component exception.
