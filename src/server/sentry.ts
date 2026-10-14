import * as Sentry from "@sentry/cloudflare";
import { RoomError } from "../domain/protocol";
import { buildRelease } from "../telemetry/release";
import {
  privacyOptions,
  publicDsn,
  type SentryEnvironment,
} from "../telemetry/privacy";

export function serverSentryOptions(
  env: SentryEnvironment,
  boundary: "worker" | "room",
): Sentry.CloudflareOptions {
  const dsn = publicDsn(env.SENTRY_DSN);
  return {
    ...privacyOptions,
    // Empty string also prevents the SDK falling back to an unvalidated env DSN.
    dsn: dsn ?? "",
    enabled: Boolean(dsn),
    environment: env.SENTRY_ENVIRONMENT || "development",
    release: env.SENTRY_RELEASE || buildRelease,
    cacheClient: false,
    // Do not install request-body, console, fetch, or other data collectors.
    // Boundary wrappers capture errors independently of these integrations.
    defaultIntegrations: false,
    integrations: [
      Sentry.eventFiltersIntegration(),
      Sentry.dedupeIntegration(),
      Sentry.functionToStringIntegration(),
    ],
    initialScope: { tags: { boundary } },
  };
}

export function reportServerError(
  error: unknown,
  operation: "api" | "room-http" | "room-command",
): void {
  if (error instanceof RoomError) return;
  // Captured inside the invocation; the SDK flushes via waitUntil after response.
  Sentry.captureException(error, { tags: { operation } });
}

export function instrumentWorker(
  handler: ExportedHandler<Env>,
): ExportedHandler<Env> {
  return Sentry.withSentry(
    (env: Env) => serverSentryOptions(env, "worker"),
    handler,
  );
}
