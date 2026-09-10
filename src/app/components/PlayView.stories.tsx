import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { PlayView } from "./PlayView";
import { sampleRoom, resultsRoom } from "./fixtures";

const meta = {
  title: "Game/Play",
  component: PlayView,
  parameters: { layout: "fullscreen" },
  args: {
    room: sampleRoom,
    you: "sam",
    connection: "connected",
    rememberHandedness: false,
    onBuzz: fn(),
  },
} satisfies Meta<typeof PlayView>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "Buzz in" }),
    );
    await expect(args.onBuzz).toHaveBeenCalledOnce();
  },
};
export const Results: Story = { args: { room: resultsRoom } };
export const HostWaiting: Story = {
  args: {
    you: "alex",
    room: { ...sampleRoom, status: "waiting", round: 0 },
    onHostCommand: fn(),
  },
};
export const HostResults: Story = {
  args: { you: "alex", room: resultsRoom, onHostCommand: fn() },
};
export const HostOffline: Story = {
  args: { you: "alex", connection: "reconnecting", onHostCommand: fn() },
};
export const HostMenu: Story = {
  args: { you: "alex", onHostCommand: fn() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Room menu" }));
    await expect(
      canvas.getByRole("button", { name: "End room" }),
    ).toBeVisible();
  },
};
export const LeftHanded: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "Room menu" }),
    );
    const control = within(canvasElement).getByRole("switch", {
      name: "Left-handed mode",
    });
    await userEvent.click(control);
    await expect(control).toBeChecked();
    await userEvent.keyboard("{Escape}");
  },
};
export const PlayersOpen: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByText("Players (4)"));
    await expect(
      within(canvasElement.ownerDocument.body).getByRole("list", {
        name: "Players",
      }),
    ).toBeVisible();
  },
};
export const Waiting: Story = {
  args: { room: { ...sampleRoom, status: "waiting", round: 0 } },
};
export const Locked: Story = {
  args: { room: { ...resultsRoom, status: "locked" }, you: "riley" },
};
export const Sending: Story = { args: { pending: true } };
export const Reconnecting: Story = { args: { connection: "reconnecting" } };
export const ConnectionLost: Story = { args: { connection: "failed" } };
export const FullRoom: Story = {
  args: {
    you: "2",
    room: {
      ...sampleRoom,
      players: Array.from({ length: 60 }, (_, i) => ({
        id: String(i),
        name: "AnEnthusiasticContestant",
        isHost: i === 0,
        online: i % 3 !== 0,
      })),
      buzzes: Array.from({ length: 60 }, (_, i) => ({
        playerId: String(i),
        position: i + 1,
      })),
    },
  },
};

export const MenuOpen: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "Room menu" }),
    );
  },
};

const checkBuzzerBounds: Story["play"] = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const button = canvas.getByRole("button", { name: "Buzz in" });
  const bounds = button.getBoundingClientRect();
  const results = canvas
    .getByRole("region", { name: "Results" })
    .getBoundingClientRect();
  await expect(bounds.top).toBeGreaterThanOrEqual(results.top + 8);
  await expect(bounds.bottom + 8).toBeLessThanOrEqual(results.bottom);
  await expect(Math.abs(bounds.width - bounds.height)).toBeLessThan(2);
  await expect(button.scrollWidth).toBeLessThanOrEqual(button.clientWidth);
};
export const Mobile: Story = {
  globals: { viewport: { value: "mobile", isRotated: false } },
  play: checkBuzzerBounds,
};
export const ShortWide: Story = {
  globals: { viewport: { value: "shortWide", isRotated: false } },
  play: checkBuzzerBounds,
};
export const ShortWideHost: Story = {
  ...ShortWide,
  args: { you: "alex", onHostCommand: fn() },
};
