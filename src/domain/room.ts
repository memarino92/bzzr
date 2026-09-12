import {
  LIMITS,
  RoomError,
  validateName,
  type Buzz,
  type Command,
  type Player,
  type RoomSnapshot,
} from "./protocol";

export interface Member extends Player {
  /** SHA-256 of a random capability; never include this in public snapshots. */
  tokenHash: string;
}

export interface RoomState {
  schemaVersion: 1;
  code: string;
  createdAt: number;
  lastActivityAt: number;
  round: number;
  status: RoomSnapshot["status"];
  players: Member[];
  spectators?: { id: string; tokenHash: string }[];
  buzzes: Buzz[];
}

export function createRoom(code: string, host: Member, now: number): RoomState {
  return {
    schemaVersion: 1,
    code,
    createdAt: now,
    lastActivityAt: now,
    round: 0,
    status: "waiting",
    players: [{ ...host, name: validateName(host.name), isHost: true }],
    buzzes: [],
  };
}

export function expiresAt(room: RoomState): number {
  return Math.min(
    room.lastActivityAt + LIMITS.idleMs,
    room.createdAt + LIMITS.lifetimeMs,
  );
}

export function ensureLive(room: RoomState, now: number): void {
  if (now >= expiresAt(room))
    throw new RoomError(
      "ROOM_EXPIRED",
      "This room has expired. Start a new room.",
      410,
    );
}

export function addPlayer(
  room: RoomState,
  player: Member,
  now: number,
): RoomState {
  ensureLive(room, now);
  if (room.players.length >= LIMITS.players)
    throw new RoomError(
      "ROOM_FULL",
      "This room has reached its 60-player limit.",
      409,
    );
  const name = validateName(player.name);
  if (
    room.players.some(
      (p) =>
        p.name.toLocaleLowerCase("en-US") === name.toLocaleLowerCase("en-US"),
    )
  ) {
    throw new RoomError(
      "NAME_TAKEN",
      "That name is already in the room. Try another.",
      409,
    );
  }
  return {
    ...room,
    lastActivityAt: now,
    players: [...room.players, { ...player, name, isHost: false }],
  };
}

export function addSpectator(
  room: RoomState,
  spectator: { id: string; tokenHash: string },
  now: number,
): RoomState {
  ensureLive(room, now);
  const spectators = room.spectators ?? [];
  if (spectators.length >= LIMITS.spectators)
    throw new RoomError(
      "SPECTATORS_FULL",
      "This room has reached its spectator limit.",
      409,
    );
  // Watching never extends game activity or consumes a player slot.
  return { ...room, spectators: [...spectators, spectator] };
}

/** Explicit departure frees membership; disconnecting alone does not. */
export function leaveRoom(
  room: RoomState,
  memberId: string,
  now: number,
): RoomState | null {
  ensureLive(room, now);
  const leaving = room.players.find((player) => player.id === memberId);
  if (!leaving)
    return {
      ...room,
      spectators: (room.spectators ?? []).filter(
        (member) => member.id !== memberId,
      ),
    };
  const players = room.players.filter((player) => player.id !== memberId);
  if (!players.length) return null;
  if (leaving.isHost) players[0] = { ...players[0]!, isHost: true };
  return {
    ...room,
    players,
    buzzes: room.buzzes
      .filter((buzz) => buzz.playerId !== memberId)
      .map((buzz, index) => ({ ...buzz, position: index + 1 })),
  };
}

/** Arrival order is the order in which the room's single authority calls this. */
export function applyCommand(
  room: RoomState,
  playerId: string,
  command: Command,
  now: number,
): RoomState | null {
  ensureLive(room, now);
  const player = room.players.find((p) => p.id === playerId);
  if (!player)
    throw new RoomError("UNAUTHORIZED", "Join the room to continue.", 401);
  if (command.type !== "buzz" && !player.isHost) {
    throw new RoomError("HOST_ONLY", "Only the host can do that.", 403);
  }
  if (command.type === "end") return null;
  // Compare-and-set makes duplicate reset clicks safe and rejects delayed buzzes.
  if (command.round !== room.round)
    throw new RoomError("STALE_ROUND", "The round changed. Try again.");
  if (command.type === "reset") {
    return {
      ...room,
      round: room.round + 1,
      status: "open",
      buzzes: [],
      lastActivityAt: now,
    };
  }
  if (command.type === "lock") {
    if (room.status !== "open") return room;
    return { ...room, status: "locked", lastActivityAt: now };
  }
  if (room.status !== "open")
    throw new RoomError("BUZZER_LOCKED", "Wait for the host to open buzzing.");
  if (room.buzzes.some((buzz) => buzz.playerId === playerId)) return room;
  return {
    ...room,
    lastActivityAt: now,
    buzzes: [...room.buzzes, { playerId, position: room.buzzes.length + 1 }],
  };
}

export function snapshot(room: RoomState, online: Set<string>): RoomSnapshot {
  return {
    code: room.code,
    round: room.round,
    status: room.status,
    expiresAt: expiresAt(room),
    players: room.players.map(({ id, name, isHost }) => ({
      id,
      name,
      isHost,
      online: online.has(id),
    })),
    buzzes: room.buzzes.map((buzz) => ({ ...buzz })),
  };
}
