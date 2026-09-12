import type { Command, RoomSnapshot } from "../../domain/protocol";
import { PlayView } from "./PlayView";
import { SpectatorView } from "./SpectatorView";

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
  pending,
  error,
  onCommand,
  onRetry,
}: RoomViewProps) {
  if (!room.players.some((player) => player.id === you))
    return (
      <SpectatorView
        room={room}
        connection={connection}
        error={error}
        onRetry={onRetry}
      />
    );
  return (
    <PlayView
      room={room}
      you={you}
      connection={connection}
      pending={pending}
      error={error}
      onRetry={onRetry}
      onBuzz={() => onCommand({ type: "buzz", round: room.round })}
      onHostCommand={onCommand}
    />
  );
}
