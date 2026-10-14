import type { RouteMiddleware } from "rwsdk/router";
import { env } from "cloudflare:workers";
import { publicDsn } from "../telemetry/privacy";

export const setCommonHeaders =
  (): RouteMiddleware =>
  ({ response, rw: { nonce } }) => {
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("Referrer-Policy", "no-referrer");
    response.headers.set(
      "Permissions-Policy",
      "geolocation=(), microphone=(), camera=()",
    );
    response.headers.set("Cache-Control", "no-store");
    if (!import.meta.env.VITE_IS_DEV_SERVER) {
      const dsn = publicDsn(env.SENTRY_BROWSER_DSN);
      const telemetryOrigin = dsn ? ` ${new URL(dsn).origin}` : "";
      response.headers.set("Strict-Transport-Security", "max-age=31536000");
      response.headers.set(
        "Content-Security-Policy",
        `default-src 'self'; script-src 'self' 'nonce-${nonce}'; style-src 'self' 'unsafe-inline'; connect-src 'self'${telemetryOrigin}; frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'`,
      );
    }
  };
