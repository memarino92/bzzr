import type { Preview } from "@storybook/react-vite";
import "../src/app/styles.css";

const preview: Preview = {
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    viewport: {
      options: {
        mobile: {
          name: "Mobile (390 × 844)",
          styles: { width: "390px", height: "844px" },
          type: "mobile",
        },
        shortWide: {
          name: "Short wide (844 × 390)",
          styles: { width: "844px", height: "390px" },
          type: "mobile",
        },
        desktop: {
          name: "Desktop (1280 × 800)",
          styles: { width: "1280px", height: "800px" },
          type: "desktop",
        },
      },
    },
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
