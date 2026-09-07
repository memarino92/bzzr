import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Buzzer } from "../../src/app/components/Buzzer";
import { RoomView } from "../../src/app/components/RoomView";
import { HostControls } from "../../src/app/components/HostControls";
import { ShareRoom } from "../../src/app/components/ShareRoom";
import { EntryForm } from "../../src/app/components/EntryForm";
import { sampleRoom, resultsRoom } from "../../src/app/components/fixtures";

describe("accessible game controls", () => {
  it("buzzes with the keyboard", async () => {
    const buzz = vi.fn();
    render(<Buzzer open connected onBuzz={buzz} />);
    const user = userEvent.setup();
    await user.tab();
    await user.keyboard(" ");
    expect(buzz).toHaveBeenCalledOnce();
  });
  it.each([
    { open: false, connected: true },
    { open: true, connected: false },
    { open: true, connected: true, pending: true },
    { open: true, connected: true, position: 2 },
  ])("disables unavailable buzzer state", (props) => {
    render(<Buzzer {...props} onBuzz={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Buzz in" })).toBeDisabled();
  });
  it("shows a player's authoritative position and no host controls", () => {
    render(
      <RoomView
        room={resultsRoom}
        you="sam"
        connection="connected"
        onCommand={vi.fn()}
        onRetry={vi.fn()}
      />,
    );
    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "Host controls" }),
    ).not.toBeInTheDocument();
    expect(
      within(screen.getByRole("list", { name: "Buzz order" })).getAllByRole(
        "listitem",
      ),
    ).toHaveLength(3);
  });
  it("shows host absence and disables buzzing while disconnected", () => {
    render(
      <RoomView
        room={{
          ...sampleRoom,
          players: sampleRoom.players.map((p) => ({ ...p, online: false })),
        }}
        you="sam"
        connection="failed"
        error="Offline"
        onCommand={vi.fn()}
        onRetry={vi.fn()}
      />,
    );
    expect(screen.getByText(/Your host is disconnected/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Retry connection" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Buzz in" })).toBeDisabled();
  });
  it("includes the observed round in host commands", async () => {
    const command = vi.fn();
    render(
      <HostControls room={sampleRoom} disabled={false} onCommand={command} />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Reset for next question" }),
    );
    expect(command).toHaveBeenCalledWith({ type: "reset", round: 1 });
    await userEvent.click(screen.getByRole("button", { name: "Lock buzzing" }));
    expect(command).toHaveBeenCalledWith({ type: "lock", round: 1 });
  });
  it("requires a concrete confirmation before ending the room", async () => {
    const command = vi.fn();
    render(
      <HostControls room={sampleRoom} disabled={false} onCommand={command} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "End room" }));
    expect(command).not.toHaveBeenCalled();
    await userEvent.click(
      await screen.findByRole("button", { name: "End room for everyone" }),
    );
    expect(command).toHaveBeenCalledWith({ type: "end" });
  });
  it("copies only the public invitation URL", async () => {
    const user = userEvent.setup();
    const clipboard = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue();
    render(<ShareRoom code="ABC234" />);
    await user.click(screen.getByRole("button", { name: "Copy invite link" }));
    expect(clipboard).toHaveBeenCalledWith(
      window.location.origin + "/room/ABC234",
    );
    expect(
      screen.getByRole("button", { name: /Link copied/ }),
    ).toBeInTheDocument();
  });
  it("offers a selectable link if clipboard access fails", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(
      new Error("Denied"),
    );
    render(<ShareRoom code="ABC234" />);
    await user.click(screen.getByRole("button", { name: "Copy invite link" }));
    expect(screen.getByLabelText("Copy this invite link")).toHaveValue(
      window.location.origin + "/room/ABC234",
    );
  });
  it("submits normalized names and codes", async () => {
    const submit = vi.fn();
    render(<EntryForm mode="join" onSubmit={submit} />);
    await userEvent.type(screen.getByLabelText("Your name"), "  Sam  ");
    await userEvent.type(screen.getByLabelText("Room code"), "abc234");
    await userEvent.click(screen.getByRole("button", { name: "Join room" }));
    expect(submit).toHaveBeenCalledWith("Sam", "ABC234");
  });
  it("shows inline validation and server failures", async () => {
    render(
      <EntryForm
        mode="join"
        roomCode="ABC234"
        error="Name taken"
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Name taken");
    await userEvent.type(screen.getByLabelText("Your name"), "x".repeat(25));
    await userEvent.click(screen.getByRole("button", { name: "Join room" }));
    expect(screen.getByRole("alert")).toHaveTextContent("between 1 and 24");
  });
});
