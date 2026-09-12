import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within, waitFor } from "storybook/test";
import { LeaveRoomAction } from "./LeaveRoomAction";

const meta = {
  title: "Game/Leave room",
  component: LeaveRoomAction,
  args: {
    onLeave: fn(),
    description: "Your seat and current buzz will be removed.",
  },
} satisfies Meta<typeof LeaveRoomAction>;
export default meta;
type Story = StoryObj<typeof meta>;
const open: Story["play"] = async ({ canvasElement }) => {
  await userEvent.click(
    within(canvasElement).getByRole("button", {
      name: "Leave room",
    }),
  );
  await expect(
    within(canvasElement.ownerDocument.body).getByRole("dialog", {
      name: "Leave this room?",
    }),
  ).toBeVisible();
};
export const Player: Story = { play: open };
export const Host: Story = {
  args: {
    description:
      "Your seat and current buzz will be removed. Sam will become the host.",
  },
  play: open,
};
export const LastPlayer: Story = {
  args: { description: "You are the last player, so the room will close." },
  play: open,
};
export const Spectator: Story = {
  args: { description: "Your spectator session will be removed." },
  play: open,
};
export const Leaving: Story = { args: { busy: true } };
export const Cancel: Story = {
  play: async (context) => {
    await open(context);
    await userEvent.click(
      within(context.canvasElement.ownerDocument.body).getByRole("button", {
        name: "Stay in room",
      }),
    );
    await expect(context.args.onLeave).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(
        within(context.canvasElement).getByRole("button", {
          name: "Leave room",
        }),
      ).toHaveFocus(),
    );
  },
};
export const Confirm: Story = {
  play: async (context) => {
    await open(context);
    await userEvent.click(
      within(context.canvasElement.ownerDocument.body).getByRole("button", {
        name: "Leave room now",
      }),
    );
    await expect(context.args.onLeave).toHaveBeenCalledOnce();
  },
};
