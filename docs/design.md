# Visual direction

bzzr takes its cues from 1990s game flyers: square panels, heavy outlines,
oversized uppercase type, and tilted labels with hard, offset shadows. Lime and
zinc remain the main palette; cyan and pink provide clashing accents. The round
buzz button keeps its original appearance and pressed interaction.

Forms and controls stay level for readability. Decorative rotations are static,
and status messages, disabled states, keyboard focus, and light/dark themes remain
part of the interface. Styles use Tailwind utilities and shared theme tokens in
`src/app/styles.css`; no external fonts or image assets are required.

Review the Home stories (including join mode), room states, and end-room dialog
at desktop and mobile sizes. Existing game behavior and server authority are
unchanged by this presentation update.

## Live play and local demos

Live rooms use the phone-first play layout. Storybook's Pages/Play examples contains
interactive, fictional three-player, 24-player, and host stories. Simulation controls
exist only in those stories; the application exposes no simulated-room route.
The host example supports opening, sample buzzes, locking, reset, and confirmed end.

The live and demo views give equal screen width to buzz order and a large circular lime buzzer
with a raised edge and pressed feedback. Left-handed mode swaps the two columns without resetting the round or
moving keyboard focus. The participant drawer starts closed, with a live count
and chevron. The whole results column scrolls, with its heading held at the top;
the buzzer and participant trigger stay in place. Participants open in a modal
bottom drawer occupying 70% of the viewport. Background scrolling is locked and
the drawer contains one scrollable list, supports Escape, and restores focus.

The hamburger menu holds separate room-code and room-link copying actions and the left-handed switch. Handedness
is stored on this device under `bzzr:left-handed` in localStorage and synchronized
between tabs. Unavailable storage falls back to the current session. Clipboard
failure offers a selectable code or link. Storybook disables persistence for deterministic
examples. New round is a demo control.

The light/dark button beside the hamburger menu follows the device appearance
until the user first presses it. That action stores an explicit `light` or `dark`
choice under `bzzr:theme`; subsequent system changes do not override it. There is
no System option. The choice survives reloads and applies across app pages. A
small nonce-protected head script restores it before the stylesheet paints.
Without a saved choice, CSS continues to follow the system, including when
JavaScript is unavailable. Blocked storage still allows switching the current
page, but cannot preserve the choice after closing or reloading it.

Storybook's Game/Play stories cover results, empty rounds, sending, locked,
waiting, connection loss, handedness, the drawer, and a full room with long names.
Pages/Room stories cover the same layout with live connection states, host absence,
errors, and retry controls. Live rooms fill the viewport; only the demo reserves
space for its simulation toolbar. See [ADR 0005](decisions/0005-mobile-play.md).

## Icons and sharing

The `b.` badge is a vector mark with outlined lettering, used for SVG and ICO
favicons and the Apple touch icon. Social assets include a 1200×630 link-preview
card and a 1080×1080 square image. Regenerate committed assets with
`node scripts/generate-brand-assets.mjs` (requires the installed Playwright browser).
The script is the editable vector source; no remote font or image service is used.

Open Graph and Twitter metadata reference the public `https://bzzr.app` card.
The metadata is generic, including on room pages, and contains no participant
names or private room data. Social crawlers will receive the new image after
deployment; their caches may need refreshing.

Storybook offers Mobile (390 × 844), Short wide (844 × 390), and Desktop (1280 × 800) viewports. Game/Play includes fixed mobile and short-wide stories, including host controls, with buzzer containment assertions. The buzzer sizes against both available width and height. Game/Room menu and Game/Handedness switch expose the controls independently.
