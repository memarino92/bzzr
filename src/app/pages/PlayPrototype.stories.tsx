import type { Meta, StoryObj } from "@storybook/react-vite";
import { PlayPrototype } from "./PlayPrototype";

const meta = {
  title: "Prototype/Populated play page",
  component: PlayPrototype,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof PlayPrototype>;
export default meta;
export const TwentyFourPlayers: StoryObj<typeof meta> = {
  args: { playerCount: 24 },
};
