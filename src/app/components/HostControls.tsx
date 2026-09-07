"use client";

import { useState } from "react";
import type { Command, RoomSnapshot } from "../../domain/protocol";
import { Button } from "./catalyst/button";
import {
  Alert,
  AlertTitle,
  AlertDescription,
  AlertActions,
} from "./catalyst/alert";

export function HostControls({
  room,
  disabled,
  onCommand,
}: {
  room: RoomSnapshot;
  disabled: boolean;
  onCommand: (command: Command) => void;
}) {
  const [confirmEnd, setConfirmEnd] = useState(false);
  return (
    <section
      aria-label="Host controls"
      className="mb-8 rounded-2xl border border-zinc-950/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-900"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">You’re running the room.</h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Reset for each question. You can buzz in too.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            color="dark/white"
            disabled={disabled}
            onClick={() => onCommand({ type: "reset", round: room.round })}
          >
            {room.round === 0 ? "Open buzzing" : "Reset for next question"}
          </Button>
          {room.status === "open" && (
            <Button
              outline
              disabled={disabled}
              onClick={() => onCommand({ type: "lock", round: room.round })}
            >
              Lock buzzing
            </Button>
          )}
          <Button plain disabled={disabled} onClick={() => setConfirmEnd(true)}>
            End room
          </Button>
        </div>
      </div>
      <Alert open={confirmEnd} onClose={setConfirmEnd}>
        <AlertTitle>End this room?</AlertTitle>
        <AlertDescription>
          Everyone will be disconnected and the names and buzz order will be
          cleared. You can always start a new room.
        </AlertDescription>
        <AlertActions>
          <Button plain onClick={() => setConfirmEnd(false)}>
            Keep playing
          </Button>
          <Button
            color="red"
            disabled={disabled}
            onClick={() => {
              setConfirmEnd(false);
              onCommand({ type: "end" });
            }}
          >
            End room for everyone
          </Button>
        </AlertActions>
      </Alert>
    </section>
  );
}
