import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { PlayMenu } from "./PlayMenu";
const meta = {
  title: "Game/Room menu",
  component: PlayMenu,
  args: { code: "DEMO23", leftHanded: false, onToggle: fn() },
  decorators: [
    (Story) => (
      <div className="flex min-h-96 justify-end p-4">
        <Story />
      </div>
    ),
  ],
  render: function Example(args) {
    const [leftHanded, setLeftHanded] = useState(args.leftHanded);
    return (
      <PlayMenu
        {...args}
        leftHanded={leftHanded}
        onToggle={() => {
          setLeftHanded(!leftHanded);
          args.onToggle();
        }}
      />
    );
  },
} satisfies Meta<typeof PlayMenu>;
export default meta;
type Story = StoryObj<typeof meta>;
const open: Story["play"] = async ({ canvasElement }) => {
  await userEvent.click(
    within(canvasElement).getByRole("button", { name: "Room menu" }),
  );
};
export const Closed: Story = {};
export const QrCode: Story = {
  play: async (context) => {
    await open(context);
    await userEvent.click(
      within(context.canvasElement).getByRole("button", {
        name: "Open QR code",
      }),
    );
    const body = within(context.canvasElement.ownerDocument.body);
    await expect(
      body.getByRole("dialog", { name: "Scan to join the room" }),
    ).toBeVisible();
    await expect(
      body.getByRole("img", { name: "Room invitation QR code" }),
    ).toBeVisible();
    await expect(
      body.getByText(window.location.origin + "/room/DEMO23"),
    ).toBeVisible();
  },
};
export const QrMobile: Story = {
  ...QrCode,
  globals: { viewport: { value: "mobile", isRotated: false } },
};
export const DismissQr: Story = {
  play: async (context) => {
    await QrCode.play!(context);
    await userEvent.keyboard("{Escape}");
    await expect(
      within(context.canvasElement.ownerDocument.body).queryByRole("dialog"),
    ).not.toBeInTheDocument();
    await expect(
      within(context.canvasElement).getByRole("button", { name: "Room menu" }),
    ).toHaveFocus();
  },
};
export const Player: Story = { play: open };
export const SpectatorLink: Story = {
  play: async (context) => {
    await open(context);
    const link = within(context.canvasElement).getByRole("link", {
      name: "Open spectator view (new tab)",
    });
    await expect(link).toHaveAttribute("href", "/room/DEMO23/spectate");
    await expect(link).toHaveAttribute("target", "_blank");
  },
};
export const Host: Story = { args: { onEnd: fn() }, play: open };
export const HostOffline: Story = {
  args: { onEnd: fn(), endDisabled: true },
  play: open,
};
export const Mobile: Story = {
  ...Host,
  globals: { viewport: { value: "mobile", isRotated: false } },
};
export const EndConfirmation: Story = {
  args: { onEnd: fn() },
  play: async (context) => {
    await open(context);
    await userEvent.click(
      within(context.canvasElement).getByRole("button", {
        name: "End room",
      }),
    );
    await expect(
      within(context.canvasElement.ownerDocument.body).getByRole("dialog", {
        name: "End this room?",
      }),
    ).toBeVisible();
  },
};
export const Dismiss: Story = {
  play: async (context) => {
    await open(context);
    await userEvent.keyboard("{Escape}");
    await expect(
      within(context.canvasElement).getByRole("button", { name: "Room menu" }),
    ).toHaveFocus();
  },
};
