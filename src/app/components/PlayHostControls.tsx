"use client";

import type { Command, RoomSnapshot } from "../../domain/protocol";

export function PlayHostControls({
  room,
  disabled,
  onCommand,
}: {
  room: RoomSnapshot;
  disabled: boolean;
  onCommand: (command: Command) => void;
}) {
  const control =
    "min-h-11 flex-1 border-2 border-zinc-950 px-2 py-2 text-xs font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-40 dark:border-zinc-400";
  return (
    <section
      aria-label="Host controls"
      className="flex shrink-0 gap-2 border-b-2 border-zinc-950 p-3 dark:border-zinc-500"
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => onCommand({ type: "reset", round: room.round })}
        className={`${control} bg-lime-300 text-zinc-950 enabled:hover:bg-lime-200`}
      >
        {room.round === 0 ? "Open buzzing" : "Next round"}
      </button>
      <button
        type="button"
        disabled={disabled || room.status !== "open"}
        onClick={() => onCommand({ type: "lock", round: room.round })}
        className={`${control} bg-white dark:bg-zinc-900`}
      >
        Lock buzzing
      </button>
    </section>
  );
}
