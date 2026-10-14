import type { ErrorEvent } from "@sentry/react";

export interface SentryEnvironment {
  SENTRY_DSN?: string;
  SENTRY_BROWSER_DSN?: string;
  SENTRY_ENVIRONMENT?: string;
  SENTRY_RELEASE?: string;
}

/** Invalid/missing configuration disables reporting without breaking the app. */
export function publicDsn(value?: string): string | undefined {
  if (!value) return;
  try {
    const url = new URL(value);
    if (
      url.protocol === "https:" &&
      /^[a-zA-Z0-9]+$/.test(url.username) &&
      !url.password &&
      /^\/\d+$/.test(url.pathname) &&
      !url.search &&
      !url.hash
    )
      return url.href;
  } catch {
    /* disabled */
  }
}

/** Only source-file locations survive. URLs, user input and source excerpts do not. */
function sourceFile(filename?: string): string | undefined {
  if (!filename) return;
  const path = filename.split(/[?#]/)[0]!.replaceAll("\\", "/");
  const match = /(?:^|\/)((?:assets|src)\/[^\s]+\.(?:js|mjs|ts|tsx))$/.exec(
    path,
  );
  if (match) return `app:///${match[1]}`;
  const bundled = /(?:^|\/)([\w.-]+\.(?:js|mjs))$/.exec(path);
  return bundled ? `app:///${bundled[1]}` : undefined;
}

/** Rebuild instead of blacklist: SDK upgrades must not expand collected data. */
export function privateError(event: ErrorEvent): ErrorEvent {
  return {
    type: undefined,
    event_id: event.event_id,
    timestamp: event.timestamp,
    platform: event.platform,
    level: event.level,
    release: event.release,
    environment: event.environment,
    // Debug IDs are needed for uploaded source maps; no module URLs are retained.
    debug_meta: event.debug_meta && {
      images: event.debug_meta.images
        ?.filter((image) => image.type === "sourcemap")
        .map((image) => ({
          type: "sourcemap",
          debug_id: image.debug_id,
          code_file: sourceFile(image.code_file) ?? "app:///unknown.js",
        })),
    },
    tags: {
      boundary: ["browser", "worker", "room"].includes(
        String(event.tags?.boundary),
      )
        ? event.tags?.boundary
        : undefined,
      operation: ["api", "room-http", "room-command"].includes(
        String(event.tags?.operation),
      )
        ? event.tags?.operation
        : undefined,
    },
    exception: {
      values: event.exception?.values?.map((exception) => ({
        type: [
          "Error",
          "TypeError",
          "RangeError",
          "ReferenceError",
          "SyntaxError",
          "URIError",
          "EvalError",
          "AggregateError",
        ].includes(exception.type ?? "")
          ? exception.type
          : "Error",
        value: "Unexpected application error",
        mechanism: exception.mechanism && {
          type: "generic",
          handled: exception.mechanism.handled,
        },
        stacktrace: {
          frames: exception.stacktrace?.frames?.map((frame) => ({
            filename: sourceFile(frame.filename),
            function: frame.function,
            lineno: frame.lineno,
            colno: frame.colno,
            in_app: frame.in_app,
          })),
        },
      })),
    },
  };
}

export const privacyOptions = {
  sendDefaultPii: false,
  sendClientReports: false,
  maxBreadcrumbs: 0,
  enableLogs: false,
  tracesSampleRate: 0,
  tracePropagationTargets: [],
  beforeSend: privateError,
};
