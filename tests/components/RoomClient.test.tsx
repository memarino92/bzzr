import { render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { RoomClient } from "../../src/app/components/RoomClient";
import { sampleRoom } from "../../src/app/components/fixtures";

const state = vi.hoisted(() => ({ current: {} as Record<string, unknown> }));
vi.mock("../../src/app/hooks/useRoom", () => ({
  useRoom: () => state.current,
}));
afterEach(() => {
  state.current = {};
});
it.each(["loading", "join", "error", "ended", "live"])(
  "renders the %s connection phase",
  (phase) => {
    state.current = {
      phase,
      reason: "closed",
      error: phase === "error" ? "Network failed" : "",
      busy: false,
      pending: false,
      connection: "connected",
      session: phase === "live" ? { room: sampleRoom, you: "sam" } : undefined,
      join: vi.fn(),
      send: vi.fn(),
      retry: vi.fn(),
    };
    render(<RoomClient code="ABC234" />);
    if (phase === "live")
      expect(screen.getByRole("button", { name: "Buzz in" })).toBeEnabled();
    else if (phase === "join")
      expect(screen.getByLabelText("Your name")).toBeVisible();
    else expect(screen.getByRole("heading")).toBeVisible();
  },
);
