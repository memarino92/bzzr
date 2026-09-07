import type { Preview } from "@storybook/react-vite";
import "../src/app/styles.css";

const preview: Preview = {
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    a11y: { test: "error" },
    backgrounds: {
      options: {
        light: { name: "Light", value: "#fafafa" },
        dark: { name: "Dark", value: "#09090b" },
      },
    },
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
  },
  decorators: [
    (Story) => (
      <div className="font-sans text-zinc-950 antialiased dark:text-white">
        <Story />
      </div>
    ),
  ],
};
export default preview;
