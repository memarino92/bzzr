import * as Sentry from "@sentry/react";
import { privacyOptions, publicDsn } from "../../telemetry/privacy";

export function initBrowserSentry() {
  const read = (key: string) =>
    document.querySelector<HTMLMetaElement>(`meta[name="sentry-${key}"]`)
      ?.content;
  const dsn = publicDsn(read("dsn"));
  if (!dsn) return {};
  Sentry.init({
    ...privacyOptions,
    dsn,
    environment: read("environment") || "development",
    release: read("release") || undefined,
    integrations: (defaults) =>
      defaults.filter(
        (integration) =>
          !["Breadcrumbs", "BrowserSession"].includes(integration.name),
      ),
    initialScope: { tags: { boundary: "browser" } },
  });
  return {
    onUncaughtError: Sentry.reactErrorHandler(),
    onCaughtError: Sentry.reactErrorHandler(),
    onRecoverableError: Sentry.reactErrorHandler(),
  };
}
