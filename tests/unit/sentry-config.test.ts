import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { setCommonHeaders } from "../../src/app/headers";
import { Document } from "../../src/app/Document";
import type { DocumentProps } from "rwsdk/router";

const bindings = vi.hoisted(() => ({
  SENTRY_BROWSER_DSN: "",
  SENTRY_DSN: "SERVER_ONLY",
  SENTRY_AUTH_TOKEN: "BUILD_SECRET",
  SENTRY_ENVIRONMENT: "production",
  SENTRY_RELEASE: "abc123",
}));
vi.mock("cloudflare:workers", () => ({ env: bindings }));
afterEach(() => {
  bindings.SENTRY_BROWSER_DSN = "";
});

describe("runtime browser configuration", () => {
  it("renders only the public configuration and allows its exact ingestion origin", () => {
    bindings.SENTRY_BROWSER_DSN = "https://public@o123.ingest.us.sentry.io/2";
    const html = renderToStaticMarkup(
      createElement(Document, {
        rw: { nonce: "test" } as DocumentProps["rw"],
        children: null,
      } as DocumentProps),
    );
    expect(html).toContain(
      'name="sentry-dsn" content="https://public@o123.ingest.us.sentry.io/2"',
    );
    expect(html).toContain('name="sentry-release" content="abc123"');
    expect(html).not.toContain("SERVER_ONLY");
    expect(html).not.toContain("BUILD_SECRET");
    const response = { headers: new Headers() };
    setCommonHeaders()({ response, rw: { nonce: "test" } } as Parameters<
      ReturnType<typeof setCommonHeaders>
    >[0]);
    expect(response.headers.get("Content-Security-Policy")).toContain(
      "connect-src 'self' https://o123.ingest.us.sentry.io;",
    );
  });
  it("does not widen CSP for malformed configuration", () => {
    bindings.SENTRY_BROWSER_DSN = "https://public:PRIVATE@sentry.test/1";
    const response = { headers: new Headers() };
    setCommonHeaders()({ response, rw: { nonce: "test" } } as Parameters<
      ReturnType<typeof setCommonHeaders>
    >[0]);
    expect(response.headers.get("Content-Security-Policy")).toContain(
      "connect-src 'self';",
    );
    expect(response.headers.get("Content-Security-Policy")).not.toContain(
      "sentry.test",
    );
  });
});
