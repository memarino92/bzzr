import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RoomConnection } from "../../src/app/lib/room-connection";
import { sampleRoom } from "../../src/app/components/fixtures";

class FakeSocket {
  static OPEN = 1;
  static CONNECTING = 0;
  static instances: FakeSocket[] = [];
  readyState = 0;
  onopen?: () => void;
  onmessage?: (event: { data: string }) => void;
  onclose?: (event: { code: number; reason: string }) => void;
  send = vi.fn();
  constructor(public url: URL) {
    FakeSocket.instances.push(this);
  }
  open() {
    this.readyState = 1;
    this.onopen?.();
  }
  message(data: unknown) {
    this.onmessage?.({
      data: typeof data === "string" ? data : JSON.stringify(data),
    });
  }
  close(code = 1006, reason = "") {
    this.readyState = 3;
    this.onclose?.({ code, reason });
  }
}
let connection: RoomConnection;
let callbacks: {
  message: ReturnType<typeof vi.fn<() => void>>;
  status: ReturnType<typeof vi.fn<() => void>>;
  sessionLost: ReturnType<typeof vi.fn<() => void>>;
};
const latest = () => FakeSocket.instances.at(-1)!;

beforeEach(() => {
  vi.useFakeTimers();
  FakeSocket.instances = [];
  vi.stubGlobal("WebSocket", FakeSocket);
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation(() => Promise.resolve(Response.json({}))),
  );
  callbacks = { message: vi.fn(), status: vi.fn(), sessionLost: vi.fn() };
  connection = new RoomConnection("ABC234", callbacks);
});
afterEach(() => {
  connection.stop();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("socket transport", () => {
  it("connects to a credential-free URL and waits for an authoritative snapshot", () => {
    connection.start();
    expect(latest().url.pathname).toBe("/api/rooms/ABC234/socket");
    expect(latest().url.search).toBe("");
    expect(connection.send({ type: "buzz", round: 1 })).toBe(false);
    latest().open();
    latest().message({ type: "snapshot", room: sampleRoom, you: "sam" });
    expect(callbacks.status).toHaveBeenLastCalledWith("connected");
    expect(connection.send({ type: "buzz", round: 1 })).toBe(true);
    expect(latest().send).toHaveBeenCalledWith('{"type":"buzz","round":1}');
  });
  it("pings without sending ping data to the UI, and detects a dead connection", async () => {
    connection.start();
    const socket = latest();
    socket.open();
    await vi.advanceTimersByTimeAsync(25_000);
    expect(socket.send).toHaveBeenCalledWith("ping");
    socket.message("pong");
    expect(callbacks.message).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(25_000);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(socket.readyState).toBe(3);
    expect(callbacks.status).toHaveBeenLastCalledWith("reconnecting");
  });
  it("reconnects with backoff and never replays buzzes", async () => {
    connection.start();
    latest().open();
    connection.send({ type: "buzz", round: 1 });
    latest().close();
    await vi.advanceTimersByTimeAsync(1000);
    expect(FakeSocket.instances).toHaveLength(2);
    latest().open();
    expect(latest().send).not.toHaveBeenCalled();
  });
  it.each([401, 404, 410])(
    "reports terminal session HTTP %s instead of looping",
    async (status) => {
      vi.mocked(fetch).mockImplementation(() =>
        Promise.resolve(Response.json({}, { status })),
      );
      connection.start();
      latest().close();
      await vi.advanceTimersByTimeAsync(20_000);
      expect(callbacks.sessionLost).toHaveBeenCalledWith(
        expect.objectContaining({ status }),
      );
      expect(FakeSocket.instances).toHaveLength(1);
    },
  );
  it("stops retrying after a policy close and recognizes room close", () => {
    connection.start();
    latest().close(1008);
    expect(callbacks.status).toHaveBeenLastCalledWith("failed");
    latest().close(4004, "closed");
    expect(callbacks.message).toHaveBeenLastCalledWith({
      type: "ended",
      reason: "closed",
    });
  });
  it("closes malformed streams and reports send failures", () => {
    connection.start();
    latest().open();
    latest().message("{");
    expect(latest().readyState).toBe(3);
    connection.stop();
    expect(connection.send({ type: "buzz", round: 1 })).toBe(false);
  });
  it("cleans up timers and does not reconnect after unmount", async () => {
    connection.start();
    latest().open();
    latest().close();
    connection.stop();
    await vi.advanceTimersByTimeAsync(60_000);
    window.dispatchEvent(new Event("online"));
    expect(FakeSocket.instances).toHaveLength(1);
  });
  it("does not resurrect a stale reconnect when online wins the race", async () => {
    let resolve!: (response: Response) => void;
    vi.mocked(fetch).mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    connection.start();
    latest().open();
    window.dispatchEvent(new Event("offline"));
    window.dispatchEvent(new Event("online"));
    expect(FakeSocket.instances).toHaveLength(2);
    latest().open();
    resolve(Response.json({}));
    await vi.advanceTimersByTimeAsync(2000);
    expect(FakeSocket.instances).toHaveLength(2);
    window.dispatchEvent(new Event("online"));
    expect(FakeSocket.instances).toHaveLength(2);
  });
});
