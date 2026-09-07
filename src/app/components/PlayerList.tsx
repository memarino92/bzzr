import type { RoomSnapshot } from "../../domain/protocol";

export function PlayerList({
  players,
  you,
}: {
  players: RoomSnapshot["players"];
  you: string;
}) {
  return (
    <section aria-label="Players" className="mt-6">
      <h2 className="mb-4 text-sm font-semibold">
        In the room{" "}
        <span className="ml-1 font-normal text-zinc-500 dark:text-zinc-400">
          ({players.length})
        </span>
      </h2>
      <ul className="flex flex-wrap gap-2">
        {players.map((player) => (
          <li
            key={player.id}
            className="flex max-w-full items-center gap-2 rounded-full border border-zinc-950/10 px-3 py-2 text-xs dark:border-white/10"
          >
            <span
              aria-hidden="true"
              className={`size-1.5 shrink-0 rounded-full ${player.online ? "bg-lime-600 dark:bg-lime-400" : "bg-zinc-400"}`}
            />
            <span className="min-w-0 break-words">
              {player.name}
              {player.id === you ? " (you)" : ""}
            </span>
            {player.isHost && (
              <span className="font-semibold text-zinc-500 dark:text-zinc-400">
                Host
              </span>
            )}
            <span className="sr-only">
              {player.online ? "Connected" : "Disconnected"}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
