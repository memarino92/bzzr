import type { Command, RoomSnapshot } from "../../domain/protocol";
import { PlayView } from "./PlayView";
import { SpectatorView } from "./SpectatorView";

export type Connection = "connecting" | "connected" | "reconnecting" | "failed";
export interface RoomViewProps {
  room: RoomSnapshot;
  you: string;
  spectating?: boolean;
  connection: Connection;
  pending?: boolean;
  error?: string;
  onCommand: (command: Command) => void;
  onRetry: () => void;
  onLeave?: () => void;
  leaving?: boolean;
}

export function RoomView({
  room,
  you,
  spectating = false,
  connection,
  pending,
  error,
  onCommand,
  onRetry,
  onLeave,
  leaving,
}: RoomViewProps) {
  const member = room.players.find((player) => player.id === you);
  const nextHost = room.players.find((player) => player.id !== you);
  const leaveDescription = !member
    ? "Your spectator session will be removed."
    : `Your seat and current buzz will be removed.${member.isHost ? (nextHost ? ` ${nextHost.name} will become the host.` : " You are the last player, so the room will close.") : ""}`;
  if (spectating || !room.players.some((player) => player.id === you))
    return (
      <SpectatorView
        room={room}
        connection={connection}
        error={error}
        onRetry={onRetry}
        onLeave={onLeave}
        leaving={leaving}
        leaveDescription={leaveDescription}
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
      onLeave={onLeave}
      leaving={leaving}
      leaveDescription={leaveDescription}
    />
  );
}
