import { env } from "cloudflare:workers";
import {
  SELF,
  evictDurableObject,
  reset,
  runDurableObjectAlarm,
  runInDurableObject,
} from "cloudflare:test";
import { afterEach, describe, expect, it } from "vitest";
import type { RoomState } from "../../src/domain/room";
import {
  LIMITS,
  type ServerMessage,
  type SessionResponse,
} from "../../src/domain/protocol";

const origin = "https://bzzr.test";
const sockets: WebSocket[] = [];
const api = (path: string, init: RequestInit = {}) =>
  SELF.fetch(origin + path, {
    ...init,
    headers: {
      Origin: origin,
      "Content-Type": "application/json",
      "CF-Connecting-IP": crypto.randomUUID(),
      ...init.headers,
    },
  });
async function create() {
  const response = await api("/api/rooms", {
    method: "POST",
    body: JSON.stringify({ name: "Alex" }),
  });
  expect(response.status).toBe(201);
  const body = (await response.json()) as { code: string; you: string };
  return {
    ...body,
    cookie: response.headers.get("Set-Cookie")!.split(";")[0]!,
  };
}
async function join(code: string, name = "Sam") {
  const response = await api(`/api/rooms/${code}/join`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  expect(response.status).toBe(200);
  return {
    ...((await response.json()) as SessionResponse),
    cookie: response.headers.get("Set-Cookie")!.split(";")[0]!,
  };
}
async function connect(code: string, cookie: string) {
  const response = await api(`/api/rooms/${code}/socket`, {
    headers: { Cookie: cookie, Upgrade: "websocket" },
  });
  expect(response.status).toBe(101);
  const ws = response.webSocket!;
  const messages: ServerMessage[] = [];
  ws.addEventListener("message", (event) => {
    if (event.data !== "pong")
      messages.push(JSON.parse(String(event.data)) as ServerMessage);
  });
  ws.accept();
  sockets.push(ws);
  async function until(predicate: (message: ServerMessage) => boolean) {
    await expect
      .poll(() => messages.find(predicate), { timeout: 4000, interval: 10 })
      .toBeTruthy();
    return messages.find(predicate)!;
  }
  await until((m) => m.type === "snapshot");
  return {
    ws,
    messages,
    until,
    send: (command: unknown) => ws.send(JSON.stringify(command)),
  };
}

afterEach(async () => {
  for (const ws of sockets.splice(0)) {
    try {
      ws.close(1000);
    } catch {
      /* closed */
    }
  }
  await reset();
});

describe("room Worker and Durable Object", () => {
  it("spectates a full room without a name, restores after eviction, and rejects all game commands", async () => {
    const host = await create();
    await Promise.all(
      Array.from({ length: LIMITS.players - 1 }, (_, i) =>
        join(host.code, `Guest ${i}`),
      ),
    );
    const response = await api(`/api/rooms/${host.code}/join`, {
      method: "POST",
      body: JSON.stringify({ spectator: true }),
    });
    expect(response.status).toBe(200);
    const spectator = (await response.json()) as SessionResponse;
    const cookie = response.headers.get("Set-Cookie")!.split(";")[0]!;
    expect(spectator.room.players).toHaveLength(60);
    expect(spectator.room.players.some((p) => p.id === spectator.you)).toBe(
      false,
    );
    expect(JSON.stringify(spectator)).not.toMatch(/tokenHash|spectators/);
    const viewer = await connect(host.code, cookie);
    const owner = await connect(host.code, host.cookie);
    owner.send({ type: "reset", round: 0 });
    await viewer.until(
      (m) => m.type === "snapshot" && m.room.status === "open",
    );
    await evictDurableObject(env.ROOMS.getByName(host.code));
    for (const command of [
      { type: "buzz", round: 1 },
      { type: "reset", round: 1 },
      { type: "lock", round: 1 },
      { type: "end" },
    ]) {
      viewer.messages.length = 0;
      viewer.send(command);
      await viewer.until(
        (m) => m.type === "error" && m.code === "UNAUTHORIZED",
      );
    }
    owner.send({ type: "buzz", round: 1 });
    await viewer.until(
      (m) => m.type === "snapshot" && m.room.buzzes.length === 1,
    );
    const restored = await api(`/api/rooms/${host.code}/session`, {
      headers: { Cookie: cookie },
    });
    expect(((await restored.json()) as SessionResponse).you).toBe(
      spectator.you,
    );
    owner.send({ type: "end" });
    await viewer.until((m) => m.type === "ended");
  });
  it("bounds spectator identities separately and does not extend room expiry", async () => {
    const host = await create();
    const stub = env.ROOMS.getByName(host.code);
    const before = await runInDurableObject(stub, (_instance, ctx) =>
      ctx.storage.get<RoomState>("room"),
    );
    await runInDurableObject(stub, async (_instance, ctx) => {
      await ctx.storage.put("room", {
        ...before!,
        spectators: Array.from({ length: LIMITS.spectators - 1 }, (_, i) => ({
          id: `viewer${i}`,
          tokenHash: `hash${i}`,
        })),
      });
    });
    await evictDurableObject(stub);
    const response = await api(`/api/rooms/${host.code}/join`, {
      method: "POST",
      body: '{"spectator":true}',
    });
    expect(response.status).toBe(200);
    const cookie = response.headers.get("Set-Cookie")!.split(";")[0]!;
    expect(
      (
        await api(`/api/rooms/${host.code}/join`, {
          method: "POST",
          body: '{"spectator":true}',
          headers: { Cookie: cookie },
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await api(`/api/rooms/${host.code}/join`, {
          method: "POST",
          body: '{"spectator":true}',
        })
      ).status,
    ).toBe(409);
    const after = await runInDurableObject(stub, (_instance, ctx) =>
      ctx.storage.get<RoomState>("room"),
    );
    expect(after!.lastActivityAt).toBe(before!.lastActivityAt);
    expect(after!.players).toHaveLength(1);
    expect(after!.spectators).toHaveLength(LIMITS.spectators);
  });
  it("creates secure host cookies and joins without exposing capabilities", async () => {
    const response = await api("/api/rooms", {
      method: "POST",
      body: '{"name":"Alex"}',
    });
    const cookie = response.headers.get("Set-Cookie")!;
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Strict");
    expect(cookie).toContain("Secure");
    const { code } = (await response.json()) as { code: string };
    const guest = await join(code);
    expect(guest.room.players.map((p) => [p.name, p.isHost])).toEqual([
      ["Alex", true],
      ["Sam", false],
    ]);
    expect(JSON.stringify(guest.room)).not.toMatch(/tokenHash|bzzr_/);
  });
  it("rejects cross-origin requests and unauthenticated socket upgrades", async () => {
    expect(
      (
        await api("/api/rooms", {
          method: "POST",
          headers: { Origin: "https://evil.test" },
          body: '{"name":"Alex"}',
        })
      ).status,
    ).toBe(403);
    const host = await create();
    expect(
      (
        await api(`/api/rooms/${host.code}/socket`, {
          headers: { Upgrade: "websocket" },
        })
      ).status,
    ).toBe(401);
    expect(
      (
        await api(`/api/rooms/${host.code}/socket`, {
          headers: {
            Origin: "https://evil.test",
            Cookie: host.cookie,
            Upgrade: "websocket",
          },
        })
      ).status,
    ).toBe(403);
  });
  it("bounds request bodies even without a content-length header", async () => {
    expect(
      (
        await api("/api/rooms", {
          method: "POST",
          body: JSON.stringify({ name: "x".repeat(2000) }),
        })
      ).status,
    ).toBe(413);
    expect(
      (await api("/api/rooms", { method: "POST", body: "{" })).status,
    ).toBe(400);
    expect(
      (
        await api("/api/rooms", {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: "{}",
        })
      ).status,
    ).toBe(415);
  });
  it("does not create storage for unknown room lookups", async () => {
    const response = await api("/api/rooms/ZZZ234/join", {
      method: "POST",
      body: '{"name":"Sam"}',
    });
    expect(response.status).toBe(404);
    const state = await runInDurableObject(
      env.ROOMS.getByName("ZZZ234"),
      async (_instance, ctx) => ({
        size: (await ctx.storage.list()).size,
        alarm: await ctx.storage.getAlarm(),
      }),
    );
    expect(state).toEqual({ size: 0, alarm: null });
  });
  it("reuses a session and rejects name collisions", async () => {
    const host = await create();
    const guest = await join(host.code);
    const repeat = await api(`/api/rooms/${host.code}/join`, {
      method: "POST",
      headers: { Cookie: guest.cookie },
      body: '{"name":"Sam"}',
    });
    expect(((await repeat.json()) as SessionResponse).you).toBe(guest.you);
    const duplicate = await api(`/api/rooms/${host.code}/join`, {
      method: "POST",
      body: '{"name":"sam"}',
    });
    expect(duplicate.status).toBe(409);
  });
  it("broadcasts authoritative order, rejects host forgery, and resets safely", async () => {
    const host = await create();
    const guest = await join(host.code);
    const h = await connect(host.code, host.cookie);
    const g = await connect(host.code, guest.cookie);
    g.send({ type: "reset", round: 0, isHost: true });
    await g.until((m) => m.type === "error" && m.code === "HOST_ONLY");
    h.send({ type: "reset", round: 0 });
    await g.until((m) => m.type === "snapshot" && m.room.round === 1);
    g.send({ type: "buzz", round: 1 });
    await h.until((m) => m.type === "snapshot" && m.room.buzzes.length === 1);
    h.send({ type: "buzz", round: 1 });
    const result = await g.until(
      (m) => m.type === "snapshot" && m.room.buzzes.length === 2,
    );
    expect(
      result.type === "snapshot" && result.room.buzzes.map((b) => b.playerId),
    ).toEqual([guest.you, host.you]);
    g.send({ type: "buzz", round: 1 });
    h.send({ type: "reset", round: 1 });
    await g.until(
      (m) =>
        m.type === "snapshot" &&
        m.room.round === 2 &&
        m.room.buzzes.length === 0,
    );
    g.send({ type: "buzz", round: 1 });
    await g.until((m) => m.type === "error" && m.code === "STALE_ROUND");
  });
  it("survives real eviction with hibernating sockets and persisted authority", async () => {
    const host = await create();
    const guest = await join(host.code);
    const h = await connect(host.code, host.cookie);
    const g = await connect(host.code, guest.cookie);
    h.send({ type: "reset", round: 0 });
    await g.until((m) => m.type === "snapshot" && m.room.round === 1);
    await evictDurableObject(env.ROOMS.getByName(host.code));
    g.send({ type: "buzz", round: 1 });
    const result = await h.until(
      (m) => m.type === "snapshot" && m.room.buzzes.length === 1,
    );
    expect(result.type === "snapshot" && result.room.buzzes[0]?.playerId).toBe(
      guest.you,
    );
    g.send({ type: "end" });
    await g.until((m) => m.type === "error" && m.code === "HOST_ONLY");
  });
  it("recovers a disconnected player's identity and buzz after reload", async () => {
    const host = await create();
    const h = await connect(host.code, host.cookie);
    h.send({ type: "reset", round: 0 });
    await h.until((m) => m.type === "snapshot" && m.room.round === 1);
    h.send({ type: "buzz", round: 1 });
    await h.until((m) => m.type === "snapshot" && m.room.buzzes.length === 1);
    h.ws.close(1000);
    const session = await api(`/api/rooms/${host.code}/session`, {
      headers: { Cookie: host.cookie },
    });
    const state = (await session.json()) as SessionResponse;
    expect(state.you).toBe(host.you);
    expect(state.room.buzzes).toEqual([{ playerId: host.you, position: 1 }]);
  });
  it("enforces the per-player socket cap", async () => {
    const host = await create();
    for (let i = 0; i < LIMITS.socketsPerPlayer; i++)
      await connect(host.code, host.cookie);
    expect(
      (
        await api(`/api/rooms/${host.code}/socket`, {
          headers: { Cookie: host.cookie, Upgrade: "websocket" },
        })
      ).status,
    ).toBe(429);
  });
  it("limits commands and closes oversized or binary frames", async () => {
    const host = await create();
    const h = await connect(host.code, host.cookie);
    const closed = new Promise<number>((resolve) =>
      h.ws.addEventListener("close", (event) => resolve(event.code)),
    );
    h.ws.send("x".repeat(LIMITS.messageBytes + 1));
    expect(await closed).toBe(1009);
  });
  it("cleans storage and sockets when the host ends the room", async () => {
    const host = await create();
    const h = await connect(host.code, host.cookie);
    h.send({ type: "end" });
    await h.until((m) => m.type === "ended" && m.reason === "closed");
    const stub = env.ROOMS.getByName(host.code);
    expect(
      await runInDurableObject(
        stub,
        async (_instance, ctx) => (await ctx.storage.list()).size,
      ),
    ).toBe(0);
    expect(
      await runInDurableObject(stub, (_instance, ctx) =>
        ctx.storage.getAlarm(),
      ),
    ).toBeNull();
    expect(
      (
        await api(`/api/rooms/${host.code}/session`, {
          headers: { Cookie: host.cookie },
        })
      ).status,
    ).toBe(404);
  });
  it("rechecks a superseded alarm and deletes all data at expiry", async () => {
    const host = await create();
    const stub = env.ROOMS.getByName(host.code);
    expect(await runDurableObjectAlarm(stub)).toBe(true);
    expect(
      await runInDurableObject(stub, (_instance, ctx) =>
        ctx.storage.getAlarm(),
      ),
    ).not.toBeNull();
    await runInDurableObject(stub, async (_instance, ctx) => {
      const state = (await ctx.storage.get<RoomState>("room"))!;
      await ctx.storage.put("room", {
        ...state,
        createdAt: Date.now() - LIMITS.lifetimeMs - 1,
      });
    });
    await evictDurableObject(stub);
    await runDurableObjectAlarm(stub);
    expect(
      await runInDurableObject(
        stub,
        async (_instance, ctx) => (await ctx.storage.list()).size,
      ),
    ).toBe(0);
    expect(await runDurableObjectAlarm(stub)).toBe(false);
  });
  it("does not overwrite a live code on creation collision", async () => {
    const stub = env.ROOMS.getByName("ABC234");
    expect(
      await stub.initialize("ABC234", "Alex", "a".repeat(64)),
    ).toBeTruthy();
    expect(await stub.initialize("ABC234", "Other", "b".repeat(64))).toBeNull();
    const state = await runInDurableObject(stub, (_instance, ctx) =>
      ctx.storage.get<RoomState>("room"),
    );
    expect(state?.players[0]?.name).toBe("Alex");
  });
});

describe("resource bounds and transport health", () => {
  it("enforces the seat cap under concurrent joins", async () => {
    const host = await create();
    const stub = env.ROOMS.getByName(host.code);
    const results = await Promise.all(
      Array.from({ length: 75 }, (_, i) =>
        stub.fetch(
          new Request("https://room.internal/join", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-bzzr-token-hash": i.toString(16).padStart(64, "0"),
            },
            body: JSON.stringify({ name: "Player " + i }),
          }),
        ),
      ),
    );
    expect(results.filter((r) => r.status === 200)).toHaveLength(59);
    expect(results.filter((r) => r.status === 409)).toHaveLength(16);
    const state = await runInDurableObject(stub, (_instance, ctx) =>
      ctx.storage.get<RoomState>("room"),
    );
    expect(state?.players).toHaveLength(60);
  });
  it("closes a command flood", async () => {
    const host = await create();
    const h = await connect(host.code, host.cookie);
    const closed = new Promise<number>((resolve) =>
      h.ws.addEventListener("close", (event) => resolve(event.code)),
    );
    for (let i = 0; i <= LIMITS.messagesPerWindow; i++)
      h.send({ type: "invalid" });
    expect(await closed).toBe(1008);
  });
  it("rejects binary command frames", async () => {
    const host = await create();
    const h = await connect(host.code, host.cookie);
    const closed = new Promise<number>((resolve) =>
      h.ws.addEventListener("close", (event) => resolve(event.code)),
    );
    h.ws.send(new Uint8Array([1, 2, 3]).buffer);
    expect(await closed).toBe(1009);
  });
  it("answers heartbeat messages without changing the expiry alarm", async () => {
    const host = await create();
    const h = await connect(host.code, host.cookie);
    const stub = env.ROOMS.getByName(host.code);
    const before = await runInDurableObject(stub, (_instance, ctx) =>
      ctx.storage.getAlarm(),
    );
    const pong = new Promise<string>((resolve) =>
      h.ws.addEventListener("message", (event) => {
        if (event.data === "pong") resolve("pong");
      }),
    );
    h.ws.send("ping");
    expect(await pong).toBe("pong");
    expect(
      await runInDurableObject(stub, (_instance, ctx) =>
        ctx.storage.getAlarm(),
      ),
    ).toBe(before);
  });
  it("throttles room creation by edge IP key", async () => {
    const key = crypto.randomUUID();
    for (let i = 0; i < 10; i++)
      expect(
        (
          await api("/api/rooms", {
            method: "POST",
            headers: { "CF-Connecting-IP": key },
            body: '{"name":"Alex"}',
          })
        ).status,
      ).toBe(201);
    expect(
      (
        await api("/api/rooms", {
          method: "POST",
          headers: { "CF-Connecting-IP": key },
          body: '{"name":"Alex"}',
        })
      ).status,
    ).toBe(429);
  });
});
