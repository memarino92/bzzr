import { describe, expect, it } from "vitest";
import {
  diagnosticText,
  privateError,
  publicDsn,
} from "../../src/telemetry/privacy";

describe("telemetry privacy boundary", () => {
  it.each([
    ["TypeError", "Cannot read properties of undefined (reading 'buzzes')"],
    ["D1Error", "SQLITE_BUSY: database is locked while persisting the round"],
    ["RoomPersistenceError", "Storage write failed after transaction rollback"],
  ])("preserves useful %s diagnostics", (type, value) => {
    const event = privateError({
      type: undefined,
      message: value,
      exception: {
        values: [
          {
            type,
            value,
            mechanism: { type: "auto.http.cloudflare", handled: false },
          },
        ],
      },
      contexts: {
        browser: { name: "Chrome", version: "130.0" },
        runtime: { name: "workerd", version: "1.0" },
        react: { props: { name: "Alex" } },
      },
    });
    expect(event.message).toBe(value);
    expect(event.exception!.values![0]).toMatchObject({
      type,
      value,
      mechanism: { type: "auto.http.cloudflare", handled: false },
    });
    expect(event.contexts).toEqual({
      browser: { name: "Chrome", version: "130.0" },
      runtime: { name: "workerd", version: "1.0" },
    });
  });

  it("scrubs sensitive values without erasing the surrounding failure", () => {
    const text = diagnosticText(
      'Storage write failed: tokenHash="PRIVATE_HASH", capability=PRIVATE_TOKEN; playerName="Alex"; request=https://bzzr.test/room/ABC234?token=PRIVATE_QUERY',
    );
    expect(text).toContain("Storage write failed:");
    expect(text).toContain("https://bzzr.test/room/[room]");
    for (const secret of [
      "PRIVATE_HASH",
      "PRIVATE_TOKEN",
      "Alex",
      "PRIVATE_QUERY",
      "ABC234",
    ])
      expect(text).not.toContain(secret);
    expect(
      diagnosticText("Cannot read properties of undefined (reading 'name')"),
    ).toBe("Cannot read properties of undefined (reading 'name')");
    expect(diagnosticText(`Hash mismatch: ${"a".repeat(64)}`)).toBe(
      "Hash mismatch: [Filtered hash]",
    );
  });

  it("retains request diagnostics without cookies, credentials, room IDs or query strings", () => {
    const event = privateError({
      type: undefined,
      request: {
        method: "POST",
        url: "https://user:password@bzzr.test/api/rooms/ABC234/join?capability=SECRET",
        headers: {
          "User-Agent": "Mozilla/5.0 Chrome/130.0",
          Cookie: "private-cookie",
          Authorization: "Bearer private-key",
        },
        data: { name: "Alex" },
      },
    });
    expect(event.request).toEqual({
      method: "POST",
      url: "https://bzzr.test/api/rooms/[room]/join",
      headers: { "User-Agent": "Mozilla/5.0 Chrome/130.0" },
    });
  });
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
      message: `Storage write failed: capability=${secret}`,
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
            value: `Storage write failed: capability=${secret}`,
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
