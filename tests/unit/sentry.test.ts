import { describe, expect, it } from "vitest";
import { privateError, publicDsn } from "../../src/telemetry/privacy";

describe("telemetry privacy boundary", () => {
  it("accepts public HTTPS DSNs and disables missing, malformed or secret DSNs", () => {
    expect(publicDsn("https://public@o1.ingest.sentry.io/42")).toBe(
      "https://public@o1.ingest.sentry.io/42",
    );
    for (const value of [
      undefined,
      "",
      "no",
      "http://public@sentry.test/1",
      "https://public:secret@sentry.test/1",
      "https://sentry.test/1",
      "https://public@sentry.test/1?token=secret",
    ]) {
      expect(publicDsn(value)).toBeUndefined();
    }
  });

  it("keeps actionable stack locations and debug IDs without private event data", () => {
    const secret = "CAPABILITY_SECRET";
    const event = privateError({
      type: undefined,
      event_id: "123",
      release: "abc123",
      environment: "test",
      message: secret,
      request: {
        url: `https://bzzr.app/room/ABC234?token=${secret}`,
        headers: { Cookie: secret },
        data: secret,
      },
      user: { id: secret, username: "Alex", ip_address: "127.0.0.1" },
      extra: { secret },
      contexts: { react: { componentStack: secret } },
      breadcrumbs: [{ message: secret }],
      tags: { boundary: "room", operation: "room-command", name: secret },
      exception: {
        values: [
          {
            type: "Error",
            value: secret,
            mechanism: { type: "generic", handled: true, data: { secret } },
            stacktrace: {
              frames: [
                {
                  filename: `https://bzzr.app/assets/client-hash.js?token=${secret}`,
                  function: "applyCommand",
                  lineno: 10,
                  colno: 2,
                  vars: { secret },
                  context_line: secret,
                },
              ],
            },
          },
        ],
      },
      debug_meta: {
        images: [
          {
            type: "sourcemap",
            debug_id: "debug-id",
            code_file: `https://bzzr.app/assets/client-hash.js?token=${secret}`,
          },
        ],
      },
    });
    const serialized = JSON.stringify(event);
    for (const value of [
      secret,
      "ABC234",
      "Alex",
      "127.0.0.1",
      "Cookie",
      "componentStack",
    ])
      expect(serialized).not.toContain(value);
    expect(event.exception!.values![0]!.stacktrace!.frames![0]).toEqual({
      filename: "app:///assets/client-hash.js",
      function: "applyCommand",
      lineno: 10,
      colno: 2,
      in_app: undefined,
    });
    expect(event.debug_meta!.images![0]).toEqual({
      type: "sourcemap",
      debug_id: "debug-id",
      code_file: "app:///assets/client-hash.js",
    });
    expect(event.tags).toEqual({ boundary: "room", operation: "room-command" });
  });
});
