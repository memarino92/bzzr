import { afterEach, expect, it, vi } from "vitest";
import * as Sentry from "@sentry/react";
import { initBrowserSentry } from "../../src/app/lib/sentry";

afterEach(async () => {
  await Sentry.close(0);
  document.head.innerHTML = "";
  vi.unstubAllGlobals();
});

it("delivers React errors using the real browser SDK without private context", async () => {
  const requests: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: string, init: RequestInit) => {
      requests.push(String(init.body));
      return new Response("{}", { status: 200 });
    }),
  );
  document.head.innerHTML =
    '<meta name="sentry-dsn" content="https://public@sentry.test/2"><meta name="sentry-environment" content="test">';
  const callbacks = initBrowserSentry();
  const error = new TypeError(
    "Cannot hydrate room: capability=PRIVATE_CAPABILITY",
  );
  error.stack =
    "TypeError: Cannot hydrate room: capability=PRIVATE_CAPABILITY\n    at renderRoom (https://bzzr.test/assets/client.js:10:2)";
  callbacks.onUncaughtError!(error, {
    componentStack: "PRIVATE_COMPONENT_PROPS",
  });
  expect(await Sentry.flush(2000)).toBe(true);
  expect(requests).toHaveLength(1);
  expect(requests[0]).toContain('"boundary":"browser"');
  expect(requests[0]).toContain("renderRoom");
  expect(requests[0]).toContain("Cannot hydrate room:");
  expect(requests[0]).toContain('"type":"TypeError"');
  expect(requests[0]).not.toContain("PRIVATE");
});
