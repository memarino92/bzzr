import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/unit/**/*.test.ts", "tests/components/**/*.test.tsx"],
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      include: [
        "src/domain/**",
        "src/app/hooks/**",
        "src/app/lib/**",
        "src/app/components/*.tsx",
        "src/server/http.ts",
      ],
      exclude: ["**/*.stories.*", "**/fixtures.*"],
      thresholds: { lines: 80, functions: 80, statements: 80, branches: 75 },
    },
  },
});
