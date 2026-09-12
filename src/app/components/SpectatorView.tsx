import type { RoomSnapshot } from "../../domain/protocol";
import type { Connection } from "./RoomView";
import { ThemeToggle } from "./ThemeToggle";
import { LeaveRoomAction } from "./LeaveRoomAction";

export function SpectatorView({
  room,
  connection,
  error,
  onRetry,
  onLeave,
  leaving,
  leaveDescription = "Your spectator session will be removed.",
}: {
  room: RoomSnapshot;
  connection: Connection;
  error?: string;
  onRetry: () => void;
  onLeave?: () => void;
  leaving?: boolean;
  leaveDescription?: string;
}) {
  const connected = connection === "connected";
  return (
    <main className="min-h-dvh bg-zinc-50 px-6 py-6 text-zinc-950 dark:bg-zinc-950 dark:text-white sm:px-12">
      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 border-b-2 border-zinc-400 pb-5">
        <h1 className="font-mono text-sm font-bold">
          {room.code} · Round {room.round} · Spectating
        </h1>
        <div className="flex items-center gap-4">
          <p
            role="status"
            className="flex items-center gap-2 text-sm font-bold"
          >
            <span
              aria-hidden="true"
              className={`size-3 rounded-full ${connected && room.status === "open" ? "bg-lime-500" : "bg-zinc-400"}`}
            />
            {!connected
              ? connection === "failed"
                ? "Updates paused · connection lost"
                : "Updates paused · reconnecting…"
              : room.status === "open"
                ? "Buzzing is open"
                : room.status === "locked"
                  ? "Buzzing is closed"
                  : "Waiting for the host"}
          </p>
          <ThemeToggle />
          {onLeave && (
            <LeaveRoomAction
              onLeave={onLeave}
              description={leaveDescription}
              busy={leaving}
            />
          )}
        </div>
      </header>
      {error && (
        <p
          role="alert"
          className="mx-auto mt-4 max-w-6xl text-red-700 dark:text-red-400"
        >
          {error}
        </p>
      )}
      {connection === "failed" && (
        <button
          onClick={onRetry}
          className="mt-4 min-h-11 border-2 px-4 font-bold"
        >
          Retry connection
        </button>
      )}
      <section
        aria-labelledby="spectator-results"
        className="mx-auto max-w-6xl py-10"
      >
        <h2
          id="spectator-results"
          className="mb-8 text-sm font-black uppercase tracking-widest"
        >
          Buzz order
        </h2>
        <p className="sr-only" aria-live="polite">
          {room.buzzes.length} buzzes recorded.
        </p>
        {!room.buzzes.length ? (
          <p className="py-20 text-center text-3xl font-bold text-zinc-500 dark:text-zinc-400">
            No buzzes yet.
          </p>
        ) : (
          <ol aria-label="Buzz order" className="space-y-4">
            {room.buzzes.map((buzz) => (
              <li
                key={buzz.playerId}
                className={`flex items-start gap-6 border-2 p-6 text-3xl font-bold sm:text-5xl ${buzz.position === 1 ? "border-zinc-950 bg-lime-300 text-zinc-950 shadow-pink" : "border-zinc-300 dark:border-zinc-700"}`}
              >
                <span className="font-mono">{buzz.position}.</span>
                <span className="min-w-0 break-words">
                  {room.players.find((player) => player.id === buzz.playerId)
                    ?.name ?? "Player"}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}
