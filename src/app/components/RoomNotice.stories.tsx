import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { RoomNotice } from "./RoomNotice";

const meta = {
  title: "Pages/Room notice",
  component: RoomNotice,
  args: { kind: "loading" },
} satisfies Meta<typeof RoomNotice>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Loading: Story = {};
export const Left: Story = { args: { kind: "left", roomCode: "ABC234" } };
export const Ended: Story = { args: { kind: "closed" } };
export const Expired: Story = { args: { kind: "expired" } };
export const NetworkError: Story = { args: { kind: "error", onRetry: fn() } };
export const NotFound: Story = { args: { kind: "not-found" } };
