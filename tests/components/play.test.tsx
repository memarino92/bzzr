import { act, render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { RoomView } from "../../src/app/components/RoomView";
import { PlayMenu } from "../../src/app/components/PlayMenu";
import { sampleRoom } from "../../src/app/components/fixtures";

afterEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
  act(() => window.dispatchEvent(new StorageEvent("storage", { key: null })));
  vi.restoreAllMocks();
});

it("sends authoritative round commands and confirms host-only ending from the menu", async () => {
  const command = vi.fn();
  const user = userEvent.setup();
  render(
    <RoomView
      room={sampleRoom}
      you="alex"
      connection="connected"
      onCommand={command}
      onRetry={vi.fn()}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Buzz in" }));
  expect(command).toHaveBeenLastCalledWith({
    type: "buzz",
    round: sampleRoom.round,
  });
  await user.click(screen.getByRole("button", { name: "Next round" }));
  expect(command).toHaveBeenLastCalledWith({
    type: "reset",
    round: sampleRoom.round,
  });
  await user.click(screen.getByRole("button", { name: "Lock buzzing" }));
  expect(command).toHaveBeenLastCalledWith({
    type: "lock",
    round: sampleRoom.round,
  });
  command.mockClear();
  await user.click(screen.getByRole("button", { name: "Room menu" }));
  await user.click(screen.getByRole("button", { name: "End room" }));
  expect(command).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Keep playing" }));
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
  await user.click(screen.getByRole("button", { name: "Room menu" }));
  await user.click(screen.getByRole("button", { name: "End room" }));
  await user.click(
    screen.getByRole("button", { name: "End room for everyone" }),
  );
  expect(command).toHaveBeenCalledExactlyOnceWith({ type: "end" });
});

it("discloses players, remembers preferences, and offers no host action to a player", async () => {
  const user = userEvent.setup();
  render(
    <RoomView
      room={sampleRoom}
      you="sam"
      connection="connected"
      onCommand={vi.fn()}
      onRetry={vi.fn()}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Participants (4)" }));
  expect(
    within(screen.getByRole("list", { name: "Participants" })).getAllByRole(
      "listitem",
    ),
  ).toHaveLength(4);
  await user.click(screen.getByRole("button", { name: "Close participants" }));
  await user.click(screen.getByRole("switch", { name: "Dark mode" }));
  expect(localStorage.getItem("bzzr:theme")).toBe("dark");
  await user.click(screen.getByRole("button", { name: "Room menu" }));
  expect(
    screen.queryByRole("button", { name: "End room" }),
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole("switch", { name: "Left-handed mode" }));
  expect(localStorage.getItem("bzzr:left-handed")).toBe("true");
  act(() =>
    window.dispatchEvent(
      new StorageEvent("storage", { key: "bzzr:theme", newValue: "light" }),
    ),
  );
  expect(screen.getByRole("switch", { name: "Dark mode" })).not.toBeChecked();
});

it("copies code and link and offers a manual fallback if clipboard is blocked", async () => {
  const user = userEvent.setup();
  const clipboard = vi
    .spyOn(navigator.clipboard, "writeText")
    .mockResolvedValue();
  render(<PlayMenu code="ABC234" leftHanded={false} onToggle={vi.fn()} />);
  await user.click(screen.getByRole("button", { name: "Room menu" }));
  await user.click(screen.getByRole("button", { name: "Copy room code" }));
  expect(clipboard).toHaveBeenLastCalledWith("ABC234");
  await user.click(screen.getByRole("button", { name: "Copy room link" }));
  expect(clipboard).toHaveBeenLastCalledWith(
    window.location.origin + "/room/ABC234",
  );
  clipboard.mockRejectedValue(new Error("Blocked"));
  await user.click(screen.getByRole("button", { name: "Room link copied ✓" }));
  const input = screen.getByLabelText("Copy this room link");
  await user.click(input);
  expect(input).toHaveValue(window.location.origin + "/room/ABC234");
});
