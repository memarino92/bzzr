import { webcrypto } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  hashToken,
  jsonError,
  randomToken,
  readJson,
  readToken,
  requireOrigin,
  sessionCookie,
} from "../../src/server/http";
import { RoomError } from "../../src/domain/protocol";

afterEach(() => vi.unstubAllGlobals());
const request = (body: string, type = "application/json") =>
  new Request("https://bzzr.test/api/rooms", {
    method: "POST",
    headers: { "Content-Type": type },
    body,
  });

describe("HTTP trust boundary", () => {
  it("normalizes known errors and hides unexpected exceptions", async () => {
    const known = jsonError(new RoomError("DENIED", "No access", 403));
    expect(known.status).toBe(403);
    expect(await known.json()).toEqual({
      code: "DENIED",
      message: "No access",
    });
    expect(await jsonError(new Error("secret")).text()).not.toContain("secret");
  });
  it("requires exact origin equality", () => {
    expect(() =>
      requireOrigin(
        new Request("https://bzzr.test", {
          headers: { Origin: "https://bzzr.test" },
        }),
      ),
    ).not.toThrow();
    for (const origin of [
      "https://evil.test",
      "https://bzzr.test.evil.test",
      "null",
    ]) {
      expect(() =>
        requireOrigin(
          new Request("https://bzzr.test", { headers: { Origin: origin } }),
        ),
      ).toThrow();
    }
    expect(() => requireOrigin(new Request("https://bzzr.test"))).toThrow();
  });
  it("reads bounded JSON and rejects invalid shapes/content", async () => {
    expect(
      await readJson(
        request('{"name":"Alex"}', "application/json; charset=utf-8"),
      ),
    ).toEqual({ name: "Alex" });
    for (const body of ["{", "null", "[]", "42"])
      await expect(readJson(request(body))).rejects.toThrow(
        "could not be read",
      );
    await expect(readJson(request("x".repeat(1100)))).rejects.toThrow(
      "too large",
    );
    await expect(readJson(request("{}", "text/plain"))).rejects.toThrow("JSON");
    await expect(
      readJson(
        new Request("https://bzzr.test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }),
      ),
    ).rejects.toThrow("required");
  });
  it("selects only a valid room-scoped capability cookie", () => {
    const token = "a".repeat(64);
    expect(
      readToken(
        new Request("https://bzzr.test", {
          headers: { Cookie: "other=value; bzzr_ABC234=" + token },
        }),
        "ABC234",
      ),
    ).toBe(token);
    expect(
      readToken(
        new Request("https://bzzr.test", {
          headers: { Cookie: "bzzr_ABC234=bad" },
        }),
        "ABC234",
      ),
    ).toBeNull();
    expect(readToken(new Request("https://bzzr.test"), "ABC234")).toBeNull();
    expect(
      sessionCookie(new Request("https://bzzr.test"), "ABC234", token),
    ).toContain("; Secure");
    expect(
      sessionCookie(new Request("http://localhost"), "ABC234", token),
    ).not.toContain("; Secure");
    expect(
      sessionCookie(new Request("https://bzzr.test"), "ABC234", token),
    ).toContain("Path=/api/rooms/ABC234; HttpOnly; SameSite=Strict");
  });
  it("generates random capabilities and hashes them without storing plaintext", async () => {
    vi.stubGlobal("crypto", webcrypto);
    const first = randomToken();
    expect(first).toMatch(/^[a-f0-9]{64}$/);
    expect(randomToken()).not.toBe(first);
    const hash = await hashToken(first);
    expect(hash).toHaveLength(64);
    expect(hash).not.toBe(first);
    expect(await hashToken(first)).toBe(hash);
  });
});
