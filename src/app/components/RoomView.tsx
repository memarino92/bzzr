import type { Command, RoomSnapshot } from "../../domain/protocol";
import { Buzzer } from "./Buzzer";
import { BuzzOrder } from "./BuzzOrder";
import { PlayerList } from "./PlayerList";
import { ShareRoom } from "./ShareRoom";
import { HostControls } from "./HostControls";
import { Badge } from "./catalyst/badge";
import { Button } from "./catalyst/button";

export type Connection = "connecting" | "connected" | "reconnecting" | "failed";
export interface RoomViewProps {
  room: RoomSnapshot;
  you: string;
  connection: Connection;
  pending?: boolean;
  error?: string;
  onCommand: (command: Command) => void;
  onRetry: () => void;
}

export function RoomView({
  room,
  you,
  connection,
  pending = false,
  error,
  onCommand,
  onRetry,
}: RoomViewProps) {
  const me = room.players.find((p) => p.id === you);
  const host = room.players.find((p) => p.isHost);
  const position = room.buzzes.find((b) => b.playerId === you)?.position;
  const connected = connection === "connected";
  return (
    <>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            Your room code
          </p>
          <h1 className="mt-3 inline-block -rotate-2 border-2 border-zinc-950 bg-lime-300 px-3 py-2 font-mono text-4xl text-zinc-950 shadow-pink font-bold tracking-[0.15em] sm:text-5xl">
            {room.code}
          </h1>
          <div className="mt-4 flex items-center gap-3">
            <Badge color={connected ? "lime" : "amber"}>
              {connected
                ? "Connected"
                : connection === "failed"
                  ? "Connection lost"
                  : "Reconnecting"}
            </Badge>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {room.round ? `Round ${room.round}` : "Getting everyone together"}
            </span>
          </div>
        </div>
        <ShareRoom code={room.code} />
      </div>
      {error && (
        <p
          role="alert"
          className="mb-5 border-2 border-red-700 bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950 dark:text-red-200"
        >
          {error}
        </p>
      )}
      {connection === "failed" && (
        <div className="mb-6">
          <Button outline onClick={onRetry}>
            Retry connection
          </Button>
        </div>
      )}
      {host && !host.online && !me?.isHost && (
        <p
          role="status"
          className="mb-6 border-2 border-amber-700 bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200"
        >
          Your host is disconnected. Their controls will return when they
          reconnect.
        </p>
      )}
      {me?.isHost && (
        <HostControls
          room={room}
          disabled={!connected || pending}
          onCommand={onCommand}
        />
      )}
      <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
        <section aria-label="Your buzzer">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              {room.status === "open"
                ? "Buzzing is open"
                : room.status === "locked"
                  ? "Buzzing is locked"
                  : "Waiting for the host"}
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              {position ? "Nice reflexes, " : "Ready, "}
              {me?.name}?
            </h2>
          </div>
          <Buzzer
            open={room.status === "open"}
            connected={connected}
            pending={pending}
            position={position}
            onBuzz={() => onCommand({ type: "buzz", round: room.round })}
          />
        </section>
        <div>
          <BuzzOrder room={room} you={you} />
          <PlayerList players={room.players} you={you} />
        </div>
      </div>
      <p className="mt-12 border-t border-zinc-950/10 pt-6 text-xs leading-5 text-zinc-500 dark:border-white/10 dark:text-zinc-400">
        Keep your video call open in another tab. Rooms clear after two hours
        without game activity, or after 24 hours total.
      </p>
    </>
  );
}
