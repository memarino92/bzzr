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

## Phone play prototype

Open `/prototype/play` for a separate, deterministic local demo. It uses three
fictional participants and simulates a buzz locally; it does not join a live room.
The existing `/room/:code` experience remains the live game.
Use `/prototype/play?players=24` to preview two dozen participants, with 23
already in the buzz order and your buzzer ready to take the final spot.
Several demo names approach the 24-character limit, including unbroken names,
to exercise wrapping in the results column and participant drawer.

The prototype gives equal screen width to buzz order and a large circular lime buzzer
with a raised edge and pressed feedback. Left-handed mode swaps the two columns without resetting the round or
moving keyboard focus. The participant drawer starts closed, with a live count
and chevron. The whole results column scrolls, with its heading held at the top;
the buzzer and participant trigger stay in place. Participants open in a modal
bottom drawer occupying 70% of the viewport. Background scrolling is locked and
the drawer contains one scrollable list, supports Escape, and restores focus.

The hamburger menu holds separate room-code and room-link copying actions and the left-handed switch. Handedness
is stored on this device under `bzzr:left-handed` in localStorage and synchronized
between tabs. Unavailable storage falls back to the current session. Clipboard
failure offers a selectable code. Storybook disables persistence for deterministic
examples. New round is a demo control.

Storybook's Prototype/Play stories cover results, empty rounds, sending, locked,
waiting, connection loss, handedness, the drawer, and a full room with long names.
Connecting this layout to the server is a follow-up decision after reviewing the
prototype.

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
