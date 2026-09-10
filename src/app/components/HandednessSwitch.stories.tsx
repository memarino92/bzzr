import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { HandednessSwitch } from "./HandednessSwitch";
const meta = {
  title: "Game/Handedness switch",
  component: HandednessSwitch,
  args: { leftHanded: false, onToggle: fn() },
  render: function Example(args) {
    const [leftHanded, setLeftHanded] = useState(args.leftHanded);
    return (
      <div className="w-72">
        <HandednessSwitch
          {...args}
          leftHanded={leftHanded}
          onToggle={() => {
            setLeftHanded(!leftHanded);
            args.onToggle();
          }}
        />
      </div>
    );
  },
} satisfies Meta<typeof HandednessSwitch>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Off: Story = {};
export const On: Story = { args: { leftHanded: true } };
export const Keyboard: Story = {
  play: async ({ canvasElement, args }) => {
    const control = within(canvasElement).getByRole("switch", {
      name: "Left-handed mode",
    });
    control.focus();
    await userEvent.keyboard(" ");
    await expect(control).toBeChecked();
    await userEvent.keyboard("{Enter}");
    await expect(control).not.toBeChecked();
    await expect(args.onToggle).toHaveBeenCalledTimes(2);
  },
};
