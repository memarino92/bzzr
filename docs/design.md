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

The prototype gives equal screen width to buzz order and a large circular lime buzzer
with a raised edge and pressed feedback. Left-handed mode swaps the two columns without resetting the round or
moving keyboard focus. The participant drawer starts closed, with a live count
and chevron. Results scroll independently when the list is long. The switch is
local to the page and resets on reload. New round is a demo control.

Storybook's Prototype/Play stories cover results, empty rounds, sending, locked,
waiting, connection loss, handedness, the drawer, and a full room with long names.
Connecting this layout to the server and choosing preference persistence are
follow-up decisions after reviewing the prototype.
