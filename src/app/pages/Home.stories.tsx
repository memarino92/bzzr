import type { Meta, StoryObj } from "@storybook/react-vite";
import { Home } from "./Home";
import { expect, userEvent, within } from "storybook/test";

const meta = {
  title: "Pages/Home",
  component: Home,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Home>;
export default meta;
export const Welcome: StoryObj<typeof meta> = {};
export const JoinRoom: StoryObj<typeof meta> = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Join an existing room" }),
    );
    await expect(canvas.getByLabelText("Room code")).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "Join an existing room" }),
    ).toHaveAttribute("aria-pressed", "true");
  },
};
