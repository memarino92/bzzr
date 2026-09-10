"use client";

import { useHandedness } from "../hooks/useHandedness";
import { PlayMenu } from "./PlayMenu";
import { ParticipantDrawer } from "./ParticipantDrawer";
import { ThemeToggle } from "./ThemeToggle";
import { PlayHostControls } from "./PlayHostControls";
import type { Command, RoomSnapshot } from "../../domain/protocol";
import type { Connection } from "./RoomView";

export interface PlayViewProps {
  room: RoomSnapshot;
  you: string;
  connection: Connection;
  pending?: boolean;
  rememberHandedness?: boolean;
  demo?: boolean;
  error?: string;
  onRetry?: () => void;
  onBuzz: () => void;
  onHostCommand?: (command: Command) => void;
}

export function PlayView({
  room,
  you,
  connection,
  pending = false,
  rememberHandedness = true,
  demo = false,
  error,
  onRetry,
  onBuzz,
  onHostCommand,
}: PlayViewProps) {
  const [leftHanded, toggleHandedness] = useHandedness(rememberHandedness);
  const connected = connection === "connected";
  const isHost = room.players.some(
    (player) => player.id === you && player.isHost,
  );
  const hostAway =
    room.players.some((player) => player.isHost && !player.online) && !isHost;
  const first = room.players.find(
    (player) => player.id === room.buzzes[0]?.playerId,
  );
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
            : isHost
              ? "Open buzzing to start"
              : "Waiting for the host";

  return (
    <div
      className={`mx-auto flex ${demo ? "h-[calc(100dvh-3rem)]" : "h-dvh"} w-full max-w-3xl flex-col bg-zinc-50 text-zinc-950 scheme-light dark:bg-zinc-950 dark:text-white dark:scheme-dark`}
    >
      <header className="flex shrink-0 items-center justify-between gap-3 border-b-2 border-zinc-950 px-4 py-3 dark:border-zinc-500">
        <a
          href="/"
          aria-label="bzzr home"
          className="grid size-10 -rotate-6 place-items-center border-2 border-zinc-950 bg-lime-300 text-xl font-black text-zinc-950 shadow-pink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
        >
          b.
        </a>
        <div className="text-center">
          <h1 className="font-mono text-sm font-bold">{room.code}</h1>
          <p className="mt-1 text-xs">
            {isHost ? "Host · " : ""}Round {room.round}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <PlayMenu
            code={room.code}
            leftHanded={leftHanded}
            onToggle={toggleHandedness}
            onEnd={
              isHost && onHostCommand
                ? () => onHostCommand({ type: "end" })
                : undefined
            }
            endDisabled={!connected || pending}
          />
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col">
        {(error || hostAway || connection === "failed") && (
          <section
            aria-label="Room alerts"
            className="max-h-[30dvh] shrink-0 overflow-y-auto border-b border-zinc-300 px-4 py-3 text-sm dark:border-zinc-600"
          >
            {error && (
              <p role="alert" className="text-red-700 dark:text-red-400">
                {error}
              </p>
            )}
            {hostAway && (
              <p className="text-amber-800 dark:text-amber-300">
                Your host is disconnected. Waiting for them to reconnect.
              </p>
            )}
            {connection === "failed" && onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-2 min-h-11 border-2 border-zinc-950 px-3 font-bold focus-visible:outline-2 focus-visible:outline-blue-600 dark:border-zinc-400"
              >
                Retry connection
              </button>
            )}
          </section>
        )}
        <p aria-live="polite" className="sr-only">
          {first
            ? `${first.name} buzzed first. ${room.buzzes.length} buzzes recorded.`
            : "No buzzes recorded."}
        </p>
        <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-3">
          <p role="status" className="text-sm font-bold">
            {status}
          </p>
          <span className="shrink-0 font-mono text-xs text-zinc-600 dark:text-zinc-400">
            {room.buzzes.length}/{room.players.length} in
          </span>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-2 border-y-2 border-zinc-950 dark:border-zinc-500">
          <section
            aria-label="Results"
            // The entire results half is the keyboard-accessible scroll region.
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
            tabIndex={0}
            className={`flex min-h-0 min-w-0 flex-col overflow-y-auto overscroll-contain [scrollbar-width:thin] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-blue-600 ${leftHanded ? "col-start-2 row-start-1" : "col-start-1 row-start-1"}`}
          >
            <h2 className="sticky top-0 z-10 shrink-0 bg-zinc-50 p-3 text-xs font-black uppercase tracking-widest dark:bg-zinc-950">
              Buzz order
            </h2>
            {room.buzzes.length === 0 ? (
              <p className="my-auto p-3 text-sm text-zinc-600 dark:text-zinc-400">
                No buzzes yet.
                <br />
                First spot’s yours.
              </p>
            ) : (
              <ol aria-label="Buzz order" className="space-y-2 px-3 pb-3">
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
            className={`flex min-h-0 min-w-0 items-center justify-center p-3 [container-type:size] ${leftHanded ? "col-start-1 row-start-1 border-r-2" : "col-start-2 row-start-1 border-l-2"} border-zinc-950 dark:border-zinc-500`}
          >
            <button
              type="button"
              aria-label="Buzz in"
              disabled={disabled}
              onClick={onBuzz}
              className={`flex aspect-square w-[min(100cqw,calc(100cqh-1rem),18rem)] shrink-0 flex-col items-center justify-center gap-2 rounded-full border-[8px] text-zinc-950 shadow-[0_8px_0_var(--color-zinc-300)] focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-blue-700 enabled:cursor-pointer enabled:active:translate-y-1 enabled:active:shadow-[0_4px_0_var(--color-zinc-300)] dark:shadow-[0_8px_0_var(--color-zinc-700)] dark:enabled:active:shadow-[0_4px_0_var(--color-zinc-700)] ${position ? "border-lime-200 bg-lime-100" : disabled ? "border-zinc-300 bg-zinc-200 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" : "border-lime-200 bg-lime-300 enabled:hover:bg-lime-200"}`}
            >
              <span className="text-[clamp(1rem,12cqh,2.25rem)] font-black tracking-tight">
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
              <span className="text-center text-[clamp(0.625rem,5cqh,0.875rem)] font-bold">
                {position
                  ? "You’re in!"
                  : disabled
                    ? "Hold tight"
                    : "Press to buzz"}
              </span>
            </button>
          </div>
        </div>

        {isHost && onHostCommand && (
          <PlayHostControls
            room={room}
            disabled={!connected || pending}
            onCommand={onHostCommand}
          />
        )}
        <ParticipantDrawer players={room.players} you={you} />
      </main>
    </div>
  );
}
