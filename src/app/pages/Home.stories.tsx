import type { Meta, StoryObj } from "@storybook/react-vite";
import { Home } from "./Home";

const meta = {
  title: "Pages/Home",
  component: Home,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Home>;
export default meta;
export const Welcome: StoryObj<typeof meta> = {};
