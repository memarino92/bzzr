/** Shared wire contract. This module must stay safe to import in the browser. */
export const LIMITS = {
  players: 60,
  spectators: 120,
  nameLength: 24,
  codeLength: 6,
  idleMs: 2 * 60 * 60 * 1000,
  lifetimeMs: 24 * 60 * 60 * 1000,
  messageBytes: 512,
  bodyBytes: 1024,
  socketsPerPlayer: 3,
  messagesPerWindow: 20,
  messageWindowMs: 10_000,
} as const;

export const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
}

export interface Buzz {
  playerId: string;
  position: number;
}

export interface RoomSnapshot {
  code: string;
  round: number;
  status: "waiting" | "open" | "locked";
  players: (Player & { online: boolean })[];
  buzzes: Buzz[];
  expiresAt: number;
}

export type Command =
  | { type: "buzz"; round: number }
  | { type: "reset"; round: number }
  | { type: "lock"; round: number }
  | { type: "end" };

export type ServerMessage =
  | { type: "snapshot"; room: RoomSnapshot; you: string }
  | { type: "error"; code: string; message: string }
  | { type: "ended"; reason: "closed" | "expired" };

export interface SessionResponse {
  room: RoomSnapshot;
  you: string;
}

export class RoomError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400,
  ) {
    super(message);
    this.name = "RoomError";
  }
}

export function normalizeCode(value: string): string {
  const code = value.trim().toUpperCase();
  if (
    code.length !== LIMITS.codeLength ||
    [...code].some((c) => !CODE_ALPHABET.includes(c))
  ) {
    throw new RoomError("INVALID_CODE", "Enter a six-character room code.");
  }
  return code;
}

export function validateName(value: unknown): string {
  if (typeof value !== "string")
    throw new RoomError("INVALID_NAME", "Enter your name.");
  const name = value.normalize("NFC").trim().replace(/\s+/gu, " ");
  // Reject control and invisible formatting characters, including bidi overrides.
  if (
    !name ||
    [...name].length > LIMITS.nameLength ||
    /[\p{Cc}\p{Cf}]/u.test(name)
  ) {
    throw new RoomError(
      "INVALID_NAME",
      "Use a name between 1 and 24 characters, without invisible characters.",
    );
  }
  return name;
}

export function parseCommand(input: unknown): Command {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new RoomError("INVALID_COMMAND", "That command could not be read.");
  }
  const command = input as Record<string, unknown>;
  if (command.type === "end") return { type: "end" };
  if (
    (command.type === "buzz" ||
      command.type === "reset" ||
      command.type === "lock") &&
    Number.isSafeInteger(command.round) &&
    Number(command.round) >= 0
  ) {
    return { type: command.type, round: Number(command.round) };
  }
  throw new RoomError("INVALID_COMMAND", "That command could not be read.");
}
