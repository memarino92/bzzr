import { LIMITS, RoomError } from "../domain/protocol";

export function jsonError(error: unknown): Response {
  const known = error instanceof RoomError;
  return Response.json(
    {
      code: known ? error.code : "INTERNAL_ERROR",
      message: known
        ? error.message
        : "Something went wrong. Please try again.",
    },
    {
      status: known ? error.status : 500,
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}

export function requireOrigin(request: Request): void {
  if (request.headers.get("Origin") !== new URL(request.url).origin) {
    throw new RoomError(
      "INVALID_ORIGIN",
      "Open bzzr directly to continue.",
      403,
    );
  }
}

export async function readJson(
  request: Request,
): Promise<Record<string, unknown>> {
  if (
    request.headers.get("Content-Type")?.split(";")[0]?.trim() !==
    "application/json"
  ) {
    throw new RoomError("INVALID_BODY", "Send a JSON request.", 415);
  }
  const reader = request.body?.getReader();
  if (!reader)
    throw new RoomError("INVALID_BODY", "A request body is required.");
  let length = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > LIMITS.bodyBytes) {
        await reader.cancel();
        throw new RoomError(
          "BODY_TOO_LARGE",
          "That request is too large.",
          413,
        );
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const data: unknown = JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(bytes),
    );
    if (!data || typeof data !== "object" || Array.isArray(data))
      throw new Error("Expected object");
    return data as Record<string, unknown>;
  } catch (error) {
    if (error instanceof RoomError) throw error;
    throw new RoomError("INVALID_BODY", "That request could not be read.");
  } finally {
    reader.releaseLock();
  }
}

export function readToken(request: Request, code: string): string | null {
  const name = "bzzr_" + code + "=";
  const token = request.headers
    .get("Cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(name))
    ?.slice(name.length);
  return token && /^[a-f0-9]{64}$/.test(token) ? token : null;
}

export function sessionCookie(
  request: Request,
  code: string,
  token: string,
): string {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `bzzr_${code}=${token}; Path=/api/rooms/${code}; HttpOnly; SameSite=Strict; Max-Age=86400${secure}`;
}

export function randomToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export async function hashToken(token: string): Promise<string> {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );
  return Array.from(new Uint8Array(bytes), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}
