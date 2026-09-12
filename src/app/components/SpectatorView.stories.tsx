import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { SpectatorView } from "./SpectatorView";
import { sampleRoom, resultsRoom } from "./fixtures";

const meta = {
  title: "Game/Spectator",
  component: SpectatorView,
  args: { room: sampleRoom, connection: "connected", onRetry: fn() },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SpectatorView>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Open: Story = {};
export const Waiting: Story = {
  args: { room: { ...sampleRoom, status: "waiting", round: 0 } },
};
export const Results: Story = { args: { room: resultsRoom } };
export const Closed: Story = {
  args: { room: { ...resultsRoom, status: "locked" } },
};
export const Reconnecting: Story = {
  args: { room: resultsRoom, connection: "reconnecting" },
};
export const Failed: Story = {
  args: { connection: "failed", error: "Could not connect to the room." },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "Retry connection" }),
    );
    await expect(args.onRetry).toHaveBeenCalled();
  },
};
export const Mobile: Story = {
  ...Results,
  globals: { viewport: { value: "mobile", isRotated: false } },
};
export const FullRoom: Story = {
  args: {
    room: {
      ...resultsRoom,
      players: Array.from({ length: 60 }, (_, i) => ({
        id: `p${i}`,
        name: `Player ${i} with a long name`,
        isHost: i === 0,
        online: true,
      })),
      buzzes: Array.from({ length: 60 }, (_, i) => ({
        playerId: `p${i}`,
        position: i + 1,
      })),
    },
  },
};
export const IncomingResults: Story = {
  render: function Example(args) {
    const [room, setRoom] = useState(sampleRoom);
    return (
      <>
        <button onClick={() => setRoom(resultsRoom)}>
          Simulate incoming buzzes
        </button>
        <button onClick={() => setRoom({ ...sampleRoom, round: 2 })}>
          Simulate next round
        </button>
        <SpectatorView {...args} room={room} />
      </>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Simulate incoming buzzes" }),
    );
    await expect(
      canvas.getByRole("list", { name: "Buzz order" }),
    ).toHaveTextContent("Sam");
    await expect(
      canvas.queryByRole("button", { name: "Buzz in" }),
    ).not.toBeInTheDocument();
    await userEvent.click(
      canvas.getByRole("button", { name: "Simulate next round" }),
    );
    await expect(canvas.getByText("No buzzes yet.")).toBeVisible();
  },
};
