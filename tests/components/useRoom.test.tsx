import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ServerMessage } from "../../src/domain/protocol";
import { sampleRoom } from "../../src/app/components/fixtures";
import { ApiError } from "../../src/app/lib/api-client";
import { useRoom } from "../../src/app/hooks/useRoom";

const mocks = vi.hoisted(() => ({
  callbacks: undefined as
    | undefined
    | {
        message: (message: ServerMessage) => void;
        status: (status: "connected" | "failed") => void;
        sessionLost: (error: ApiError) => void;
      },
  start: vi.fn(),
  stop: vi.fn(),
  send: vi.fn(),
}));
vi.mock("../../src/app/lib/room-connection", () => ({
  RoomConnection: class {
    constructor(_code: string, callbacks: typeof mocks.callbacks) {
      mocks.callbacks = callbacks;
    }
    start = mocks.start;
    stop = mocks.stop;
    send = mocks.send;
  },
}));
const session = { room: sampleRoom, you: "sam" };
beforeEach(() => {
  vi.clearAllMocks();
  mocks.send.mockReturnValue(true);
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(session)));
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("room hook lifecycle", () => {
  it("loads a session, subscribes, receives updates, and cleans up", async () => {
    const { result, unmount } = renderHook(() => useRoom("ABC234"));
    expect(result.current.phase).toBe("loading");
    await waitFor(() => expect(mocks.start).toHaveBeenCalledOnce());
    act(() => mocks.callbacks?.status("connected"));
    act(() => result.current.send({ type: "buzz", round: 1 }));
    expect(result.current.pending).toBe(true);
    act(() => result.current.send({ type: "buzz", round: 1 }));
    expect(mocks.send).toHaveBeenCalledOnce();
    act(() =>
      mocks.callbacks?.message({
        type: "snapshot",
        room: { ...sampleRoom, buzzes: [{ playerId: "sam", position: 1 }] },
        you: "sam",
      }),
    );
    expect(result.current.session?.room.buzzes).toHaveLength(1);
    expect(result.current.pending).toBe(false);
    unmount();
    expect(mocks.stop).toHaveBeenCalledOnce();
  });
  it("asks for a name on missing session and joins with a cookie response", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      Response.json({ code: "UNAUTHORIZED", message: "Join" }, { status: 401 }),
    );
    const { result } = renderHook(() => useRoom("ABC234"));
    await waitFor(() => expect(result.current.phase).toBe("join"));
    await act(() => result.current.join("Sam"));
    expect(result.current.phase).toBe("live");
    expect(fetch).toHaveBeenLastCalledWith(
      "/api/rooms/ABC234/join",
      expect.objectContaining({ method: "POST", body: '{"name":"Sam"}' }),
    );
  });
  it.each([404, 410])("shows room expiry for HTTP %s", async (status) => {
    vi.mocked(fetch).mockResolvedValue(
      Response.json({ code: "GONE", message: "Gone" }, { status }),
    );
    const { result } = renderHook(() => useRoom("ABC234"));
    await waitFor(() => expect(result.current.phase).toBe("ended"));
  });
  it("shows network failures and retries initial session loading", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Offline"));
    const { result } = renderHook(() => useRoom("ABC234"));
    await waitFor(() => expect(result.current.error).toBe("Offline"));
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.phase).toBe("live"));
  });
  it("retains join errors and handles expired invites during join", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(Response.json({}, { status: 401 }));
    const { result } = renderHook(() => useRoom("ABC234"));
    await waitFor(() => expect(result.current.phase).toBe("join"));
    vi.mocked(fetch).mockResolvedValueOnce(
      Response.json({ message: "Name taken" }, { status: 409 }),
    );
    await act(() => result.current.join("Sam"));
    expect(result.current.error).toBe("Name taken");
    expect(result.current.busy).toBe(false);
    vi.mocked(fetch).mockResolvedValueOnce(Response.json({}, { status: 410 }));
    await act(() => result.current.join("Sam"));
    expect(result.current.phase).toBe("ended");
  });
  it("handles lost sessions, server errors, and a host-ended room", async () => {
    const { result } = renderHook(() => useRoom("ABC234"));
    await waitFor(() => expect(mocks.start).toHaveBeenCalled());
    act(() =>
      mocks.callbacks?.message({
        type: "error",
        code: "STALE_ROUND",
        message: "Round changed",
      }),
    );
    expect(result.current.error).toBe("Round changed");
    act(() => mocks.callbacks?.message({ type: "ended", reason: "closed" }));
    expect(result.current.phase).toBe("ended");
    expect(result.current.reason).toBe("closed");
    expect(mocks.stop).toHaveBeenCalled();
  });
  it("never sends while disconnected, and reports failed sends", async () => {
    const { result } = renderHook(() => useRoom("ABC234"));
    await waitFor(() => expect(mocks.start).toHaveBeenCalled());
    act(() => result.current.send({ type: "buzz", round: 1 }));
    expect(mocks.send).not.toHaveBeenCalled();
    act(() => mocks.callbacks?.status("connected"));
    mocks.send.mockReturnValue(false);
    act(() => result.current.send({ type: "buzz", round: 1 }));
    expect(result.current.error).toContain("disconnected");
    act(() =>
      mocks.callbacks?.sessionLost(new ApiError(401, "UNAUTHORIZED", "Join")),
    );
    expect(result.current.phase).toBe("join");
  });
  it("times out an unconfirmed command without replaying it", async () => {
    const { result } = renderHook(() => useRoom("ABC234"));
    await waitFor(() => expect(mocks.start).toHaveBeenCalled());
    vi.useFakeTimers();
    act(() => mocks.callbacks?.status("connected"));
    act(() => result.current.send({ type: "buzz", round: 1 }));
    act(() => vi.advanceTimersByTime(8000));
    expect(result.current.phase).toBe("error");
    expect(result.current.error).toContain("may have arrived");
    expect(mocks.send).toHaveBeenCalledOnce();
  });
});
