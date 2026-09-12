import { describe, expect, it } from "vitest";
import {
  addPlayer,
  applyCommand,
  createRoom,
  ensureLive,
  expiresAt,
  leaveRoom,
  snapshot,
} from "../../src/domain/room";
import {
  LIMITS,
  normalizeCode,
  parseCommand,
  validateName,
} from "../../src/domain/protocol";

const host = {
  id: "host",
  name: "Alex",
  tokenHash: "private-host",
  isHost: true,
};
const guest = {
  id: "guest",
  name: "Sam",
  tokenHash: "private-guest",
  isHost: false,
};
const setup = () => addPlayer(createRoom("ABC234", host, 100), guest, 101);
const open = () =>
  applyCommand(setup(), "host", { type: "reset", round: 0 }, 102)!;

describe("room rules", () => {
  it("removes a departing buzz and reassigns remaining positions without changing round or expiry", () => {
    const first = applyCommand(
      open(),
      "guest",
      { type: "buzz", round: 1 },
      103,
    )!;
    const second = applyCommand(
      first,
      "host",
      { type: "buzz", round: 1 },
      104,
    )!;
    const after = leaveRoom(second, "guest", 105)!;
    expect(after.buzzes).toEqual([{ playerId: "host", position: 1 }]);
    expect(after.round).toBe(1);
    expect(after.status).toBe("open");
    expect(expiresAt(after)).toBe(expiresAt(second));
    expect(second.players).toHaveLength(2);
    expect(second.buzzes).toHaveLength(2);
  });
  it("starts locked until the host opens the first round", () => {
    const room = setup();
    expect(room.status).toBe("waiting");
    expect(() =>
      applyCommand(room, "guest", { type: "buzz", round: 0 }, 102),
    ).toThrow("Wait for the host");
  });
  it("records arrival order, allows the host to buzz, and deduplicates", () => {
    const first = applyCommand(
      open(),
      "guest",
      { type: "buzz", round: 1 },
      103,
    )!;
    const second = applyCommand(
      first,
      "host",
      { type: "buzz", round: 1 },
      103,
    )!;
    expect(second.buzzes).toEqual([
      { playerId: "guest", position: 1 },
      { playerId: "host", position: 2 },
    ]);
    expect(applyCommand(second, "guest", { type: "buzz", round: 1 }, 105)).toBe(
      second,
    );
  });
  it("resets the order and rejects late packets and repeated resets", () => {
    const buzzed = applyCommand(
      open(),
      "guest",
      { type: "buzz", round: 1 },
      103,
    )!;
    const reset = applyCommand(
      buzzed,
      "host",
      { type: "reset", round: 1 },
      104,
    )!;
    expect(reset.buzzes).toEqual([]);
    expect(reset.round).toBe(2);
    expect(() =>
      applyCommand(reset, "guest", { type: "buzz", round: 1 }, 105),
    ).toThrow("round changed");
    expect(() =>
      applyCommand(reset, "host", { type: "reset", round: 1 }, 105),
    ).toThrow("round changed");
  });
  it.each(["reset", "lock", "end"] as const)(
    "enforces host authority for %s",
    (type) => {
      expect(() =>
        applyCommand(open(), "guest", { type, round: 1 }, 103),
      ).toThrow("Only the host");
    },
  );
  it("rejects an unknown player", () => {
    expect(() =>
      applyCommand(open(), "intruder", { type: "buzz", round: 1 }, 103),
    ).toThrow("Join the room");
  });
  it("locks without discarding results and allows the host to end", () => {
    const buzzed = applyCommand(
      open(),
      "guest",
      { type: "buzz", round: 1 },
      103,
    )!;
    const locked = applyCommand(
      buzzed,
      "host",
      { type: "lock", round: 1 },
      104,
    )!;
    expect(locked.buzzes).toEqual(buzzed.buzzes);
    expect(() =>
      applyCommand(locked, "host", { type: "buzz", round: 1 }, 105),
    ).toThrow("Wait for the host");
    expect(applyCommand(locked, "host", { type: "end" }, 105)).toBeNull();
  });
  it("expires at the idle boundary even if clients keep reconnecting", () => {
    const room = setup();
    expect(() => ensureLive(room, expiresAt(room) - 1)).not.toThrow();
    expect(() => ensureLive(room, expiresAt(room))).toThrow("expired");
  });
  it("caps lifetime even when activity is recent", () => {
    const room = { ...setup(), lastActivityAt: LIMITS.lifetimeMs };
    expect(expiresAt(room)).toBe(100 + LIMITS.lifetimeMs);
  });
  it("rejects duplicate normalized names and a full roster", () => {
    expect(() =>
      addPlayer(setup(), { ...guest, id: "other", name: "  sAm " }, 103),
    ).toThrow("already in");
    const full = {
      ...setup(),
      players: Array.from({ length: LIMITS.players }, () => host),
    };
    expect(() => addPlayer(full, guest, 103)).toThrow("60-player");
  });
  it("strips credentials and derives presence from connections", () => {
    const publicRoom = snapshot(open(), new Set(["host"]));
    expect(JSON.stringify(publicRoom)).not.toMatch(/private|tokenHash/);
    expect(publicRoom.players.map((p) => p.online)).toEqual([true, false]);
  });
});

describe("untrusted input", () => {
  it("normalizes room codes", () =>
    expect(normalizeCode(" abc234 ")).toBe("ABC234"));
  it.each(["ABC", "ABCO01", "ABC2345", "<script>"])(
    "rejects code %s",
    (code) => {
      expect(() => normalizeCode(code)).toThrow();
    },
  );
  it("supports Unicode names and collapses whitespace", () => {
    expect(validateName("  José   🚀 ")).toBe("José 🚀");
    expect(validateName("e\u0301")).toBe("é");
  });
  it.each([
    "",
    " ".repeat(4),
    "a".repeat(25),
    "hide\u202E",
    "zero\u200B",
    null,
    42,
  ])("rejects invalid names", (name) => {
    expect(() => validateName(name)).toThrow();
  });
  it.each([
    null,
    [],
    {},
    { type: "buzz", round: "1" },
    { type: "buzz", round: -1 },
    { type: "buzz", round: Infinity },
    { type: "admin", round: 1 },
  ])("rejects invalid commands", (command) => {
    expect(() => parseCommand(command)).toThrow();
  });
  it("uses only known command fields", () => {
    expect(
      parseCommand({ type: "buzz", round: 1, isHost: true, at: 0 }),
    ).toEqual({ type: "buzz", round: 1 });
  });
});
