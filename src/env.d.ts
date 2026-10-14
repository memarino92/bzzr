import type { SentryEnvironment } from "./telemetry/privacy";

// Merge optional runtime bindings with Wrangler's generated interfaces.
/* eslint-disable @typescript-eslint/no-empty-object-type */

declare global {
  interface Env extends SentryEnvironment {}
  namespace Cloudflare {
    interface Env extends SentryEnvironment {}
  }
}
