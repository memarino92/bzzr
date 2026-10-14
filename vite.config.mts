import { defineConfig } from "vite";
import { redwood } from "rwsdk/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { sentryVitePlugin } from "@sentry/vite-plugin";

const uploadSourcemaps = Boolean(process.env.SENTRY_AUTH_TOKEN);
const release = process.env.SENTRY_RELEASE || process.env.WORKERS_CI_COMMIT_SHA;
if (
  uploadSourcemaps &&
  (!process.env.SENTRY_ORG ||
    !process.env.SENTRY_PROJECT ||
    !process.env.SENTRY_BROWSER_PROJECT)
) {
  throw new Error(
    "Sentry uploads require SENTRY_ORG, SENTRY_PROJECT, and SENTRY_BROWSER_PROJECT.",
  );
}

// The deploy build owns uploads. Ordinary CI and local builds need no secrets.
const sentryPlugins = [
  sentryVitePlugin({
    org: process.env.SENTRY_ORG,
    project: uploadSourcemaps
      ? [
          ...new Set([
            process.env.SENTRY_PROJECT!,
            process.env.SENTRY_BROWSER_PROJECT!,
          ]),
        ]
      : undefined,
    authToken: process.env.SENTRY_AUTH_TOKEN,
    release: {
      name: release,
      create: uploadSourcemaps,
      finalize: uploadSourcemaps,
      setCommits: false,
    },
    sourcemaps: { assets: "./dist/**" },
    telemetry: false,
    silent: !uploadSourcemaps,
  }),
];

export default defineConfig({
  define: { __SENTRY_BUILD_RELEASE__: JSON.stringify(release || "") },
  plugins: [
    tailwindcss(),
    cloudflare({ viteEnvironment: { name: "worker" } }),
    redwood(),
    ...sentryPlugins,
  ],
  build: { sourcemap: "hidden" },
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    watch: {
      ignored: [
        "**/playwright-report/**",
        "**/test-results/**",
        "**/coverage/**",
        "**/storybook-static/**",
      ],
    },
  },
});
