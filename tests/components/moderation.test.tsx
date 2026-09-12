import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { ParticipantDrawer } from "../../src/app/components/ParticipantDrawer";
import { sampleRoom } from "../../src/app/components/fixtures";

it.each(["remove", "ban"] as const)(
  "sends %s only after the required confirmations and closes the drawer",
  async (type) => {
    const onModerate = vi.fn();
    const user = userEvent.setup();
    render(
      <ParticipantDrawer
        players={sampleRoom.players}
        you="alex"
        onModerate={onModerate}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Players (4)" }));
    expect(
      screen.queryByRole("button", { name: "Remove Alex" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remove Sam" }));
    expect(
      screen.getByRole("dialog", { name: "Remove Sam?" }),
    ).toHaveTextContent("Remove lets them join again");
    expect(onModerate).not.toHaveBeenCalled();
    if (type === "ban") {
      await user.click(screen.getByRole("button", { name: "Ban" }));
      expect(
        screen.getByRole("dialog", { name: "Are you sure?" }),
      ).toHaveTextContent("There is no way to undo this.");
      expect(onModerate).not.toHaveBeenCalled();
      await user.click(screen.getByRole("button", { name: "Ban player" }));
    } else {
      await user.click(screen.getByRole("button", { name: "Remove" }));
    }
    expect(onModerate).toHaveBeenCalledExactlyOnceWith({
      type,
      playerId: "sam",
    });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: "Players (4)" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  },
);

it("cancels a ban and resets the confirmation flow when reopened", async () => {
  const onModerate = vi.fn();
  const user = userEvent.setup();
  render(
    <ParticipantDrawer
      players={sampleRoom.players}
      you="alex"
      onModerate={onModerate}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Players (4)" }));
  await user.click(screen.getByRole("button", { name: "Remove Sam" }));
  await user.click(screen.getByRole("button", { name: "Ban" }));
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(onModerate).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Remove Sam" }));
  expect(screen.getByRole("dialog", { name: "Remove Sam?" })).toBeVisible();
  expect(
    screen.queryByRole("button", { name: "Ban player" }),
  ).not.toBeInTheDocument();
  await user.keyboard("{Escape}");
  await user.click(screen.getByRole("button", { name: "Close players" }));
  expect(onModerate).not.toHaveBeenCalled();
});

it("hides moderation when the host role is lost while confirming", async () => {
  const onModerate = vi.fn();
  const user = userEvent.setup();
  const { rerender } = render(
    <ParticipantDrawer
      players={sampleRoom.players}
      you="alex"
      onModerate={onModerate}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Players (4)" }));
  await user.click(screen.getByRole("button", { name: "Remove Sam" }));
  rerender(
    <ParticipantDrawer
      players={sampleRoom.players}
      you="jules"
      onModerate={onModerate}
    />,
  );
  await waitFor(() =>
    expect(
      screen.queryByRole("dialog", { name: "Remove Sam?" }),
    ).not.toBeInTheDocument(),
  );
  expect(
    screen.queryByRole("button", { name: /Remove/ }),
  ).not.toBeInTheDocument();
  expect(onModerate).not.toHaveBeenCalled();
});

it("disables an open confirmation when the connection becomes unavailable", async () => {
  const onModerate = vi.fn();
  const user = userEvent.setup();
  const { rerender } = render(
    <ParticipantDrawer
      players={sampleRoom.players}
      you="alex"
      onModerate={onModerate}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Players (4)" }));
  await user.click(screen.getByRole("button", { name: "Remove Sam" }));
  rerender(
    <ParticipantDrawer
      players={sampleRoom.players}
      you="alex"
      onModerate={onModerate}
      disabled
    />,
  );
  const remove = screen.getByRole("button", { name: "Remove" });
  expect(remove).toBeDisabled();
  expect(screen.getByRole("button", { name: "Ban" })).toBeDisabled();
  await user.click(remove);
  expect(onModerate).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(screen.getByRole("button", { name: "Remove Sam" })).toBeDisabled();
});

it("dismisses confirmation when the selected player leaves", async () => {
  const onModerate = vi.fn();
  const user = userEvent.setup();
  const { rerender } = render(
    <ParticipantDrawer
      players={sampleRoom.players}
      you="alex"
      onModerate={onModerate}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Players (4)" }));
  await user.click(screen.getByRole("button", { name: "Remove Sam" }));
  await user.click(screen.getByRole("button", { name: "Ban" }));
  rerender(
    <ParticipantDrawer
      players={sampleRoom.players.filter((player) => player.id !== "sam")}
      you="alex"
      onModerate={onModerate}
    />,
  );
  await waitFor(() =>
    expect(
      screen.queryByRole("dialog", { name: "Are you sure?" }),
    ).not.toBeInTheDocument(),
  );
  expect(
    screen.queryByRole("button", { name: "Remove Sam" }),
  ).not.toBeInTheDocument();
  expect(onModerate).not.toHaveBeenCalled();
});
