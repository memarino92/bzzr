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

/** Keep diagnostic prose; redact recognizable credential fields and values. */
export function diagnosticText(value?: string): string | undefined {
  if (value === undefined) return;
  return value
    .replace(
      /\b(?:https?|wss?):\/\/[^\s<>"']+/gi,
      (url) => diagnosticUrl(url) ?? "[Filtered URL]",
    )
    .replace(
      /\b(?:Cookie|Set-Cookie|Authorization)\s*:[^\r\n]+/gi,
      (header) => `${header.split(":", 1)[0]}: [Filtered]`,
    )
    .replace(/\bbzzr_[A-Z0-9]{6}=[^\s;,]+/g, "bzzr_[room]=[Filtered]")
    .replace(/\bBearer\s+[^\s,;"']+/gi, "Bearer [Filtered]")
    .replace(
      /((?:["']?)(?:token(?:[_-]?hash)?|capability|password|secret|api[_-]?key|access[_-]?token|player[_-]?name|participant[_-]?name)(?:["']?)\s*[:=]\s*)(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[^\s,;}]+)/gi,
      "$1[Filtered]",
    )
    .replace(
      /(["']name["']\s*:\s*)(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/gi,
      "$1[Filtered]",
    )
    .replace(/\b[0-9a-f]{64}\b/gi, "[Filtered hash]")
    .replace(/\bsntry[su]_[A-Za-z0-9._-]+/g, "[Filtered token]")
    .replace(
      /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
      "[Filtered token]",
    )
    .slice(0, 8192);
}

function diagnosticUrl(value?: string): string | undefined {
  if (!value) return;
  try {
    const url = new URL(value);
    if (!["https:", "http:", "wss:", "ws:"].includes(url.protocol)) return;
    return `${url.origin}${url.pathname.replace(/(\/(?:api\/)?rooms?\/)[^/]+/gi, "$1[room]")}`;
  } catch {
    return;
  }
}

/** Preserve source locations and source-map matching; omit URL credentials/query. */
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

/** Rebuild event structure, while retaining the diagnostics needed to fix errors. */
export function privateError(event: ErrorEvent): ErrorEvent {
  return {
    type: undefined,
    event_id: event.event_id,
    timestamp: event.timestamp,
    platform: event.platform,
    level: event.level,
    release: event.release,
    environment: event.environment,
    message: diagnosticText(event.message),
    request: event.request && {
      url: diagnosticUrl(event.request.url),
      method: event.request.method,
      // Sentry uses this to identify browser/OS versions. Other headers stay out.
      headers: Object.fromEntries(
        Object.entries(event.request.headers ?? {})
          .filter(([key]) => key.toLowerCase() === "user-agent")
          .map(([key, value]) => [key, diagnosticText(value) ?? ""]),
      ),
    },
    contexts: Object.fromEntries(
      Object.entries(event.contexts ?? {})
        .filter(([key]) => ["browser", "os", "runtime", "device"].includes(key))
        .map(([key, context]) => [
          key,
          Object.fromEntries(
            Object.entries(context ?? {})
              .filter(
                ([field]) =>
                  [
                    "name",
                    "version",
                    "build",
                    "brand",
                    "family",
                    "model",
                    "arch",
                  ].includes(field) && !(key === "device" && field === "name"),
              )
              .filter(
                ([, value]) =>
                  typeof value === "string" ||
                  typeof value === "boolean" ||
                  typeof value === "number",
              )
              .map(([field, value]) => [
                field,
                typeof value === "string" ? diagnosticText(value) : value,
              ]),
          ),
        ]),
    ),
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
        type: /^[\w.$-]{1,120}$/.test(exception.type ?? "")
          ? exception.type
          : "Error",
        value: diagnosticText(exception.value),
        mechanism: exception.mechanism && {
          type: /^[\w.-]{1,120}$/.test(exception.mechanism.type)
            ? exception.mechanism.type
            : "generic",
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
