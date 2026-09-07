# Product roadmap

## v1: implemented

A named host creates a room. Players join by a copyable public link or short code,
register a unique display name, and buzz once per round. The host opens/resets,
locks, and ends the room, and may buzz too. Everyone sees the same server-recorded
order. Refreshes retain identity; temporary disconnects recover without replaying
buzzes. Rooms expire and clean up automatically.

Video calls, questions, answers, and scoring are outside the app.

## Next decisions

- Host transfer, removal of disruptive participants, and graceful leaving.
  Decide recovery authority and how a removed seat affects current-round order.
- Additional sharing integrations. Keep public invitations separate from credentials.
- Accessibility review with real assistive technology and physical mobile devices;
  expand browser coverage to WebKit and Firefox.
- Production usage measurements, staged load tests, and cost alerts.
- A polished visual identity, sound/haptic preferences, and optional themes.
  Keep feedback accessible and avoid blocking the authoritative confirmation.

## Later

Explore in-app calls using Cloudflare's realtime offerings. Define consent, device
permissions, moderation, room cleanup, and a separate media cost model first.
Questions, scoring, accounts, and historical results require their own data
retention decisions. They are not hidden assumptions in the v1 schema.
