import { defineConfig } from "vitest/config";
import { cloudflareTest } from "@cloudflare/vitest-pool-workers";

export default defineConfig({
  plugins: [
    cloudflareTest({
      main: "./tests/integration/worker.ts",
      wrangler: { configPath: "./wrangler.jsonc" },
      remoteBindings: false,
    }),
  ],
  test: {
    include: ["tests/integration/**/*.test.ts"],
    testTimeout: 15_000,
    hookTimeout: 15_000,
  },
});
