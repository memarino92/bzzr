import { afterEach, beforeEach, vi } from "vitest";

export const envelopes: string[] = [];
beforeEach(() => {
  envelopes.length = 0;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string | URL, init?: RequestInit) => {
      if (!String(url).startsWith("https://sentry.test/api/1/envelope/")) {
        throw new Error(
          "Unexpected outbound network request in integration test",
        );
      }
      const body = init?.body;
      envelopes.push(
        typeof body === "string"
          ? body
          : new TextDecoder().decode(body as Uint8Array),
      );
      return new Response("{}", { status: 200 });
    }),
  );
});
afterEach(() => vi.unstubAllGlobals());
