import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn, expect, userEvent, within } from "storybook/test";
import { EntryForm } from "./EntryForm";

const meta = {
  title: "Game/Entry form",
  component: EntryForm,
  args: { mode: "host", onSubmit: fn() },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-md p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EntryForm>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Host: Story = {};
export const JoinByCode: Story = {
  args: { mode: "join" },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("Your name"), "Sam");
    await userEvent.type(canvas.getByLabelText("Room code"), "abc234");
    await userEvent.click(canvas.getByRole("button", { name: "Join room" }));
    await expect(args.onSubmit).toHaveBeenCalledWith("Sam", "ABC234");
  },
};
export const Invited: Story = { args: { mode: "join", roomCode: "ABC234" } };
export const Busy: Story = { args: { busy: true } };
export const NameTaken: Story = {
  args: {
    mode: "join",
    error: "That name is already in the room. Try another.",
  },
};
export const RoomFull: Story = {
  args: { mode: "join", error: "This room has reached its 60-player limit." },
};
