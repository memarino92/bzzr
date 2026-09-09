"use client";

import { useState } from "react";
import type { RoomSnapshot } from "../../domain/protocol";
import type { Connection } from "./RoomView";

export interface PlayViewProps {
  room: RoomSnapshot;
  you: string;
  connection: Connection;
  pending?: boolean;
  onBuzz: () => void;
}

export function PlayView({
  room,
  you,
  connection,
  pending = false,
  onBuzz,
}: PlayViewProps) {
  const [leftHanded, setLeftHanded] = useState(false);
  const connected = connection === "connected";
  const position = room.buzzes.find((buzz) => buzz.playerId === you)?.position;
  const disabled =
    !connected || room.status !== "open" || pending || !!position;
  const status = !connected
    ? connection === "failed"
      ? "Connection lost"
      : "Reconnecting…"
    : position
      ? `You’re #${position}`
      : pending
        ? "Sending…"
        : room.status === "open"
          ? "Buzzing is open"
          : room.status === "locked"
            ? "Buzzing is locked"
            : "Waiting for the host";

  return (
    <div className="mx-auto flex min-h-[calc(100svh-3rem)] w-full max-w-3xl flex-col bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-white">
      <header className="flex items-center justify-between gap-3 border-b-2 border-zinc-950 px-4 py-3 dark:border-zinc-500">
        <h1 className="font-mono text-sm font-bold">Room {room.code}</h1>
        <span className="text-sm font-bold">Round {room.round}</span>
      </header>

      <main className="flex flex-1 flex-col">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <p role="status" className="text-sm font-bold">
            {status}
          </p>
          <span className="shrink-0 font-mono text-xs text-zinc-600 dark:text-zinc-400">
            {room.buzzes.length}/{room.players.length} in
          </span>
        </div>

        <div className="grid min-h-72 flex-1 grid-cols-2 border-y-2 border-zinc-950 dark:border-zinc-500">
          <section
            aria-label="Results"
            className={`flex min-w-0 flex-col p-3 ${leftHanded ? "col-start-2 row-start-1" : "col-start-1 row-start-1"}`}
          >
            <h2 className="mb-3 text-xs font-black uppercase tracking-widest">
              Buzz order
            </h2>
            {room.buzzes.length === 0 ? (
              <p className="my-auto text-sm text-zinc-600 dark:text-zinc-400">
                No buzzes yet.
                <br />
                First spot’s yours.
              </p>
            ) : (
              <ol
                aria-label="Buzz order"
                // Keyboard users need to focus this independently scrolling list.
                // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
                tabIndex={0}
                className="max-h-[55svh] space-y-2 overflow-y-auto overscroll-contain focus-visible:outline-2 focus-visible:outline-blue-600"
              >
                {room.buzzes.map((buzz) => (
                  <li
                    key={buzz.playerId}
                    className={`flex items-start gap-2 border-b border-zinc-300 py-3 dark:border-zinc-700 ${buzz.playerId === you ? "bg-lime-200 px-2 text-zinc-950" : ""}`}
                  >
                    <span className="font-mono text-sm font-black">
                      {buzz.position}.
                    </span>
                    <span className="min-w-0 break-words text-sm font-bold">
                      {room.players.find(
                        (player) => player.id === buzz.playerId,
                      )?.name ?? "Player"}
                      {buzz.playerId === you && (
                        <span className="block text-xs font-normal">You</span>
                      )}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <div
            className={`flex min-w-0 items-center justify-center px-3 py-6 ${leftHanded ? "col-start-1 row-start-1 border-r-2" : "col-start-2 row-start-1 border-l-2"} border-zinc-950 dark:border-zinc-500`}
          >
            <button
              type="button"
              aria-label="Buzz in"
              disabled={disabled}
              onClick={onBuzz}
              className={`flex aspect-square w-full max-w-72 shrink-0 flex-col items-center justify-center gap-2 rounded-full border-[8px] text-zinc-950 shadow-[0_8px_0_var(--color-zinc-300)] focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-blue-700 enabled:cursor-pointer enabled:active:translate-y-1 enabled:active:shadow-[0_4px_0_var(--color-zinc-300)] dark:shadow-[0_8px_0_var(--color-zinc-700)] dark:enabled:active:shadow-[0_4px_0_var(--color-zinc-700)] ${position ? "border-lime-200 bg-lime-100" : disabled ? "border-zinc-300 bg-zinc-200 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" : "border-lime-200 bg-lime-300 enabled:hover:bg-lime-200"}`}
            >
              <span className="text-2xl font-black tracking-tight sm:text-4xl">
                {position
                  ? `#${position}`
                  : pending
                    ? "Sending"
                    : !connected
                      ? "Offline"
                      : room.status === "open"
                        ? "BUZZ"
                        : "Wait"}
              </span>
              <span className="text-center text-xs font-bold sm:text-sm">
                {position
                  ? "You’re in!"
                  : disabled
                    ? "Hold tight"
                    : "Press to buzz"}
              </span>
            </button>
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={leftHanded}
          onClick={() => setLeftHanded(!leftHanded)}
          className="flex min-h-20 w-full items-center justify-between gap-3 border-b-2 border-zinc-950 px-4 py-4 text-left focus-visible:outline-4 focus-visible:outline-offset-[-4px] focus-visible:outline-blue-600 dark:border-zinc-500"
        >
          <span className="text-sm font-bold">Left-handed mode</span>
          <span
            aria-hidden="true"
            className={`flex h-11 w-24 shrink-0 items-center border-2 border-zinc-950 p-1 dark:border-zinc-400 ${leftHanded ? "flex-row-reverse bg-lime-300" : "bg-zinc-200 dark:bg-zinc-800"}`}
          >
            <span className="h-full w-8 border-2 border-zinc-950 bg-white" />
            <span
              className={`flex-1 text-center font-mono text-xs font-black ${leftHanded ? "text-zinc-950" : ""}`}
            >
              {leftHanded ? "ON" : "OFF"}
            </span>
          </span>
        </button>

        <details className="group border-b-2 border-zinc-950 dark:border-zinc-500">
          <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 text-sm font-bold focus-visible:outline-4 focus-visible:outline-offset-[-4px] focus-visible:outline-blue-600 [&::-webkit-details-marker]:hidden">
            <span>Participants ({room.players.length})</span>
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="size-6 group-open:rotate-180"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </summary>
          <ul
            aria-label="Participants"
            // Keyboard users need to focus the drawer's scrolling content.
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
            tabIndex={0}
            className="max-h-60 divide-y divide-zinc-300 overflow-y-auto px-4 pb-4 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-blue-600 dark:divide-zinc-700"
          >
            {room.players.map((player) => (
              <li
                key={player.id}
                className="flex items-start justify-between gap-3 py-3 text-sm"
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
        </details>
      </main>
    </div>
  );
}
