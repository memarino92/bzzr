"use client";

import { useId, useState } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import type { RoomSnapshot } from "../../domain/protocol";

export function ParticipantDrawer({
  players,
  you,
}: {
  players: RoomSnapshot["players"];
  you: string;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen(true)}
        className="flex min-h-16 w-full shrink-0 items-center justify-between gap-3 border-b-2 border-zinc-950 px-4 py-4 text-sm font-bold focus-visible:outline-4 focus-visible:outline-offset-[-4px] focus-visible:outline-blue-600 dark:border-zinc-500"
      >
        <span>Participants ({players.length})</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className="size-6"
        >
          <path d="m6 15 6-6 6 6" />
        </svg>
      </button>
      <Dialog open={open} onClose={setOpen} className="fixed inset-0 z-40">
        <DialogBackdrop className="fixed inset-0 bg-zinc-950/60" />
        <DialogPanel
          id={panelId}
          className="fixed inset-x-0 bottom-0 mx-auto flex h-[70dvh] max-h-[calc(100dvh-1rem)] max-w-3xl flex-col border-2 border-zinc-950 bg-zinc-50 text-zinc-950 scheme-light dark:scheme-dark dark:border-zinc-500 dark:bg-zinc-950 dark:text-white"
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b-2 border-zinc-950 px-4 py-3 dark:border-zinc-500">
            <DialogTitle className="text-base font-black">
              Participants ({players.length})
            </DialogTitle>
            <button
              type="button"
              aria-label="Close participants"
              onClick={() => setOpen(false)}
              className="grid size-11 place-items-center border-2 border-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-zinc-400"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="size-6"
              >
                <path d="m6 6 12 12M6 18 18 6" />
              </svg>
            </button>
          </div>
          <ul
            aria-label="Participants"
            // The drawer has one keyboard-accessible scroll area.
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
            tabIndex={0}
            className="min-h-0 flex-1 divide-y divide-zinc-300 overflow-y-auto overscroll-contain [scrollbar-width:thin] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-blue-600 dark:divide-zinc-700"
          >
            {players.map((player) => (
              <li
                key={player.id}
                className="flex items-start justify-between gap-3 py-4 text-sm"
              >
                <span className="min-w-0 break-words font-bold">
                  {player.name}
                  {player.id === you ? " (you)" : ""}
                  {player.isHost && (
                    <span className="block text-xs font-normal">Host</span>
                  )}
                </span>
                <span className="text-xs text-zinc-600 dark:text-zinc-400">
                  {player.online ? "Online" : "Offline"}
                </span>
              </li>
            ))}
          </ul>
        </DialogPanel>
      </Dialog>
    </>
  );
}
