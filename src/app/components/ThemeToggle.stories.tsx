import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { ThemeToggle } from "./ThemeToggle";

const meta = {
  title: "Game/Theme toggle",
  component: ThemeToggle,
  decorators: [
    (Story) => (
      <div className="inline-block bg-zinc-50 p-6 text-zinc-950 dark:bg-zinc-950 dark:text-white">
        <Story />
      </div>
    ),
  ],
  beforeEach: ({ parameters }) => {
    const previous = document.documentElement.dataset.theme;
    const saved = localStorage.getItem("bzzr:theme");
    document.documentElement.dataset.theme = parameters.theme;
    return () => {
      if (previous) document.documentElement.dataset.theme = previous;
      else delete document.documentElement.dataset.theme;
      if (saved === null) localStorage.removeItem("bzzr:theme");
      else localStorage.setItem("bzzr:theme", saved);
    };
  },
} satisfies Meta<typeof ThemeToggle>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Light: Story = { parameters: { theme: "light" } };
export const Dark: Story = { parameters: { theme: "dark" } };
export const Toggle: Story = {
  parameters: { theme: "light" },
  play: async ({ canvasElement }) => {
    const control = within(canvasElement).getByRole("switch", {
      name: "Dark mode",
    });
    await userEvent.click(control);
    await expect(control).toBeChecked();
    await userEvent.click(control);
    await expect(control).not.toBeChecked();
  },
};
