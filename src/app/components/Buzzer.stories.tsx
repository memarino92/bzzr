import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { Buzzer } from "./Buzzer";

const meta = {
  title: "Game/Buzzer",
  component: Buzzer,
  args: { open: true, connected: true, onBuzz: fn() },
} satisfies Meta<typeof Buzzer>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Ready: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "Buzz in" }),
    );
    await expect(args.onBuzz).toHaveBeenCalled();
  },
};
export const Waiting: Story = { args: { open: false } };
export const Sending: Story = { args: { pending: true } };
export const First: Story = { args: { position: 1 } };
export const Later: Story = { args: { position: 4 } };
export const Offline: Story = { args: { connected: false } };
