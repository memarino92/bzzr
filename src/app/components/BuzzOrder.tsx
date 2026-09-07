import type { RoomSnapshot } from "../../domain/protocol";

export function BuzzOrder({ room, you }: { room: RoomSnapshot; you: string }) {
  const first = room.players.find((p) => p.id === room.buzzes[0]?.playerId);
  return (
    <section
      aria-labelledby="buzz-order-heading"
      className="rounded-2xl border border-zinc-950/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-900"
    >
      <div className="mb-6 flex items-center justify-between">
        <h2 id="buzz-order-heading" className="text-lg font-semibold">
          Buzz order
        </h2>
        <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
          {room.buzzes.length} / {room.players.length}
        </span>
      </div>
      <p className="sr-only" role="status">
        {first
          ? `${first.name} buzzed first. ${room.buzzes.length} buzzes recorded.`
          : "No buzzes yet."}
      </p>
      {room.buzzes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 px-6 py-10 text-center dark:border-zinc-700">
          <p className="text-sm font-semibold">
            The first spot is up for grabs.
          </p>
          <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            {room.status === "open"
              ? "Buzzes will appear here, in order."
              : "Get ready. Your host sets the pace."}
          </p>
        </div>
      ) : (
        <ol aria-label="Buzz order" className="space-y-2">
          {room.buzzes.map((buzz) => {
            const player = room.players.find((p) => p.id === buzz.playerId);
            return (
              <li
                key={buzz.playerId}
                className={`flex items-center gap-4 rounded-xl px-4 py-4 ${buzz.position === 1 ? "bg-lime-100 text-zinc-950" : "bg-zinc-50 dark:bg-zinc-800"}`}
              >
                <span className="w-7 font-mono text-lg font-bold">
                  {String(buzz.position).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1 break-words font-medium">
                  {player?.name ?? "Player"}
                  {buzz.playerId === you && (
                    <span className="ml-2 text-xs font-normal opacity-70">
                      (you)
                    </span>
                  )}
                </span>
                {buzz.position === 1 && (
                  <span className="text-xs font-bold uppercase tracking-wider">
                    First
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      )}
      <p className="mt-5 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
        Order is recorded when buzzes reach the room. Network speed can make a
        difference.
      </p>
    </section>
  );
}
