import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn, expect, userEvent, within } from "storybook/test";
import { RoomView } from "./RoomView";
import { sampleRoom, resultsRoom } from "./fixtures";

const meta = {
  title: "Pages/Room",
  component: RoomView,
  args: {
    room: sampleRoom,
    you: "sam",
    connection: "connected",
    onCommand: fn(),
    onRetry: fn(),
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof RoomView>;
export default meta;
type Story = StoryObj<typeof meta>;
export const PlayerReady: Story = {};
export const PlayerSpectatorTab: Story = {
  args: { spectating: true, room: resultsRoom },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("list", { name: "Buzz order" }),
    ).toHaveTextContent("Sam");
    await expect(
      canvas.queryByRole("button", { name: "Buzz in" }),
    ).not.toBeInTheDocument();
    await expect(
      canvas.queryByRole("region", { name: "Host controls" }),
    ).not.toBeInTheDocument();
  },
};
export const HostSpectatorTab: Story = {
  ...PlayerSpectatorTab,
  args: { ...PlayerSpectatorTab.args, you: "alex" },
};
export const HostWaiting: Story = {
  args: { you: "alex", room: { ...sampleRoom, round: 0, status: "waiting" } },
};
export const HostResults: Story = { args: { you: "alex", room: resultsRoom } };
export const PlayerFirst: Story = { args: { room: resultsRoom } };
export const Locked: Story = {
  args: { room: { ...resultsRoom, status: "locked" } },
};
export const Reconnecting: Story = { args: { connection: "reconnecting" } };
export const ConnectionFailed: Story = {
  args: {
    connection: "failed",
    error: "Close another tab for this room, then retry.",
  },
};
export const HostAway: Story = {
  args: {
    room: {
      ...sampleRoom,
      players: sampleRoom.players.map((p) => ({ ...p, online: !p.isHost })),
    },
  },
};
export const LongNames: Story = {
  args: {
    room: {
      ...resultsRoom,
      players: sampleRoom.players.map((p) => ({
        ...p,
        name: "A very enthusiastic name",
      })),
    },
  },
};
export const FullRoom: Story = {
  args: {
    room: {
      ...sampleRoom,
      players: Array.from({ length: 60 }, (_, i) => ({
        id: String(i),
        name: "Player " + (i + 1),
        isHost: i === 0,
        online: i % 4 !== 0,
      })),
      buzzes: Array.from({ length: 60 }, (_, i) => ({
        playerId: String(i),
        position: i + 1,
      })),
    },
    you: "2",
  },
};
export const PlayARound: Story = {
  render: function Demo(args) {
    const [room, setRoom] = useState({
      ...sampleRoom,
      round: 0,
      status: "waiting" as "waiting" | "open" | "locked",
    });
    return (
      <RoomView
        {...args}
        you="alex"
        room={room}
        onCommand={(command) => {
          if (command.type === "reset")
            setRoom({
              ...room,
              status: "open",
              round: room.round + 1,
              buzzes: [],
            });
          if (command.type === "lock") setRoom({ ...room, status: "locked" });
          if (command.type === "buzz" && !room.buzzes.length)
            setRoom({ ...room, buzzes: [{ playerId: "alex", position: 1 }] });
        }}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Open buzzing" }));
    await userEvent.click(canvas.getByRole("button", { name: "Buzz in" }));
    await expect(canvas.getByText("#1")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Next round" }));
    await expect(canvas.getByRole("button", { name: "Buzz in" })).toBeEnabled();
  },
};
