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
export const Player: Story = { play: open };
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
