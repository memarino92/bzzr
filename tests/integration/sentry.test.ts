import { env } from "cloudflare:workers";
import {
  SELF,
  createExecutionContext,
  waitOnExecutionContext,
  reset,
  runInDurableObject,
} from "cloudflare:test";
import { afterEach, expect, it } from "vitest";
import { instrumentWorker } from "../../src/server/sentry";
import { handleApi } from "../../src/server/api";
import type { RoomState } from "../../src/domain/room";
import { envelopes } from "./setup";

afterEach(() => reset());

it.each(["", "invalid", "https://public:PRIVATE@sentry.test/1"])(
  "disables delivery for missing or invalid server DSNs (%#)",
  async (dsn) => {
    const worker = instrumentWorker({
      fetch() {
        throw new Error("Disabled reporting");
      },
    });
    const ctx = createExecutionContext();
    await expect(
      worker.fetch!(
        incomingRequest("https://bzzr.test/"),
        { ...env, SENTRY_DSN: dsn },
        ctx,
      ),
    ).rejects.toThrow("Disabled reporting");
    await waitOnExecutionContext(ctx);
    expect(envelopes).toHaveLength(0);
  },
);

function incomingRequest(url: string, init?: RequestInit) {
  return new Request(url, init) as Request<
    unknown,
    IncomingRequestCfProperties
  >;
}

it("reports caught API exceptions without reporting expected validation failures", async () => {
  const worker = instrumentWorker({
    fetch: (request, bindings) => handleApi(request, bindings),
  });
  const request = incomingRequest("https://bzzr.test/api/rooms", {
    method: "POST",
    headers: {
      Origin: "https://bzzr.test",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: "Private player" }),
  });
  const ctx = createExecutionContext();
  const response = await worker.fetch!(
    request,
    {
      ...env,
      CREATE_LIMITER: {
        limit: async () => {
          throw new Error("PRIVATE_FAILURE");
        },
      },
    },
    ctx,
  );
  expect(response.status).toBe(500);
  await waitOnExecutionContext(ctx);
  expect(envelopes).toHaveLength(1);
  expect(envelopes[0]).toContain('"operation":"api"');
  expect(envelopes[0]).not.toContain("PRIVATE_FAILURE");
  expect(envelopes[0]).not.toContain("Private player");
});

it("reports a caught WebSocket command failure after hibernation", async () => {
  const created = await SELF.fetch("https://bzzr.test/api/rooms", {
    method: "POST",
    headers: {
      Origin: "https://bzzr.test",
      "Content-Type": "application/json",
      "CF-Connecting-IP": crypto.randomUUID(),
    },
    body: JSON.stringify({ name: "Private player" }),
  });
  const { code } = (await created.json()) as { code: string };
  const cookie = created.headers.get("Set-Cookie")!.split(";")[0]!;
  const response = await SELF.fetch(
    `https://bzzr.test/api/rooms/${code}/socket`,
    {
      headers: {
        Origin: "https://bzzr.test",
        Cookie: cookie,
        Upgrade: "websocket",
        "CF-Connecting-IP": crypto.randomUUID(),
      },
    },
  );
  const ws = response.webSocket!;
  ws.accept();
  try {
    const stub = env.ROOMS.getByName(code);
    await runInDurableObject(stub, async (_instance, ctx) => {
      const state = await ctx.storage.get<RoomState>("room");
      await ctx.storage.put("room", { ...state, status: "open", buzzes: null });
    });
    const { evictDurableObject } = await import("cloudflare:test");
    await evictDurableObject(stub);
    ws.send(JSON.stringify({ type: "buzz", round: 0 }));
    await expect
      .poll(() => envelopes.join())
      .toContain('"operation":"room-command"');
    expect(envelopes.join()).toContain('"boundary":"room"');
    expect(envelopes.join()).not.toContain(cookie);
    expect(envelopes.join()).not.toContain(code);
    expect(envelopes.join()).not.toContain("Private player");
  } finally {
    ws.close(1000);
  }
});

it("flushes an unhandled Worker exception after the handler completes", async () => {
  const worker = instrumentWorker({
    fetch() {
      throw new Error("PRIVATE_WORKER_PAYLOAD");
    },
  });
  const ctx = createExecutionContext();
  await expect(
    worker.fetch!(
      incomingRequest("https://bzzr.test/room/ABC234?secret=PRIVATE"),
      env,
      ctx,
    ),
  ).rejects.toThrow("PRIVATE_WORKER_PAYLOAD");
  await waitOnExecutionContext(ctx);
  expect(envelopes).toHaveLength(1);
  expect(envelopes[0]).toContain('"boundary":"worker"');
  expect(envelopes[0]).not.toContain("PRIVATE");
  expect(envelopes[0]).not.toContain("ABC234");
});

it("captures an unexpected caught room HTTP error but leaves normal errors quiet", async () => {
  const missing = await SELF.fetch(
    "https://bzzr.test/api/rooms/ABC234/session",
    { headers: { Cookie: "bzzr_ABC234=test" } },
  );
  expect(missing.status).toBeGreaterThanOrEqual(400);
  expect(envelopes).toHaveLength(0);
  const stub = env.ROOMS.getByName("ABC234");
  // Invalid persisted state simulates a storage/schema failure in the production handler.
  await runInDurableObject(stub, async (_instance, ctx) => {
    await ctx.storage.put("room", {
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  });
  // Reload the malformed record through the actual constructor and handler.
  const { evictDurableObject } = await import("cloudflare:test");
  await evictDurableObject(stub);
  const response = await stub.fetch("https://room.internal/session", {
    headers: { "x-bzzr-token-hash": "PRIVATE_HASH" },
  });
  expect(response.status).toBe(500);
  await expect.poll(() => envelopes.length).toBeGreaterThan(0);
  expect(envelopes.join()).toContain('"operation":"room-http"');
  expect(envelopes.join()).not.toContain("PRIVATE_HASH");
});
