import { afterEach, describe, expect, it, vi } from "vitest";
import * as Sentry from "@sentry/react";
import { initBrowserSentry } from "../../src/app/lib/sentry";

vi.mock("@sentry/react", () => ({
  init: vi.fn(),
  reactErrorHandler: vi.fn(() => vi.fn()),
}));
afterEach(() => {
  document.head.innerHTML = "";
  vi.clearAllMocks();
});

describe("browser telemetry bootstrap", () => {
  it("leaves local development disabled without a public DSN", () => {
    expect(initBrowserSentry()).toEqual({});
    expect(Sentry.init).not.toHaveBeenCalled();
  });
  it("uses only the public runtime configuration and wires all hydration error hooks", () => {
    document.head.innerHTML =
      '<meta name="sentry-dsn" content="https://public@sentry.test/2"><meta name="sentry-environment" content="production"><meta name="sentry-release" content="abc123">';
    const options = initBrowserSentry();
    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: "https://public@sentry.test/2",
        environment: "production",
        release: "abc123",
        sendDefaultPii: false,
        tracesSampleRate: 0,
        maxBreadcrumbs: 0,
      }),
    );
    expect(options).toEqual({
      onCaughtError: expect.any(Function),
      onUncaughtError: expect.any(Function),
      onRecoverableError: expect.any(Function),
    });
  });
});
