import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within, waitFor } from "storybook/test";
import { ParticipantDrawer } from "./ParticipantDrawer";
import { sampleRoom } from "./fixtures";

const meta = {
  title: "Game/Participants",
  component: ParticipantDrawer,
  args: { players: sampleRoom.players, you: "alex", onModerate: fn() },
} satisfies Meta<typeof ParticipantDrawer>;
export default meta;
type Story = StoryObj<typeof meta>;

export const RemoveConfirmation: Story = {
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(page.getByRole("button", { name: "Players (4)" }));
    await userEvent.click(page.getByRole("button", { name: "Remove Sam" }));
    await waitFor(() =>
      expect(page.getByRole("heading", { name: "Remove Sam?" })).toBeVisible(),
    );
  },
};
export const BanConfirmation: Story = {
  play: async (context) => {
    await RemoveConfirmation.play!(context);
    const page = within(context.canvasElement.ownerDocument.body);
    await userEvent.click(page.getByRole("button", { name: "Ban" }));
    await waitFor(() =>
      expect(
        page.getByRole("heading", { name: "Are you sure?" }),
      ).toBeVisible(),
    );
    await expect(page.getByText(/There is no way to undo this/)).toBeVisible();
    await expect(context.args.onModerate).not.toHaveBeenCalled();
  },
};
export const BanPlayer: Story = {
  play: async (context) => {
    await BanConfirmation.play!(context);
    const page = within(context.canvasElement.ownerDocument.body);
    await userEvent.click(page.getByRole("button", { name: "Ban player" }));
    await expect(context.args.onModerate).toHaveBeenCalledWith({
      type: "ban",
      playerId: "sam",
    });
  },
};
export const RemovePlayer: Story = {
  play: async (context) => {
    await RemoveConfirmation.play!(context);
    const page = within(context.canvasElement.ownerDocument.body);
    await userEvent.click(page.getByRole("button", { name: "Remove" }));
    await expect(context.args.onModerate).toHaveBeenCalledWith({
      type: "remove",
      playerId: "sam",
    });
  },
};
export const CancelBan: Story = {
  play: async (context) => {
    await BanConfirmation.play!(context);
    const page = within(context.canvasElement.ownerDocument.body);
    await userEvent.click(page.getByRole("button", { name: "Cancel" }));
    await expect(
      page.getByRole("button", { name: "Remove Sam" }),
    ).toBeVisible();
    await expect(context.args.onModerate).not.toHaveBeenCalled();
  },
};
export const PlayerMode: Story = {
  args: { you: "sam" },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(page.getByRole("button", { name: "Players (4)" }));
    await expect(
      page.queryByRole("button", { name: /Remove/ }),
    ).not.toBeInTheDocument();
  },
};
export const Disconnected: Story = {
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(page.getByRole("button", { name: "Players (4)" }));
    await expect(
      page.getByRole("button", { name: "Remove Sam" }),
    ).toBeDisabled();
  },
};
