import {
  CODE_ALPHABET,
  LIMITS,
  RoomError,
  normalizeCode,
  validateName,
} from "../domain/protocol";
import {
  hashToken,
  jsonError,
  randomToken,
  readJson,
  readToken,
  requireOrigin,
  sessionCookie,
} from "./http";
import type { RoomBindings } from "./env";

function randomCode(): string {
  // The alphabet has exactly 32 symbols, so masking produces no modulo bias.
  return Array.from(
    crypto.getRandomValues(new Uint8Array(LIMITS.codeLength)),
    (byte) => CODE_ALPHABET[byte & 31],
  ).join("");
}

async function limit(request: Request, limiter: RateLimit): Promise<void> {
  // Cloudflare supplies this header at the edge. Local workerd uses a shared key.
  const key = request.headers.get("CF-Connecting-IP") ?? "local";
  if (!(await limiter.limit({ key })).success) {
    throw new RoomError(
      "RATE_LIMITED",
      "Too many attempts. Wait a minute and try again.",
      429,
    );
  }
}

export async function handleApi(
  request: Request,
  env: RoomBindings,
): Promise<Response> {
  try {
    const path = new URL(request.url).pathname;
    if (path === "/api/rooms" && request.method === "POST") {
      requireOrigin(request);
      await limit(request, env.CREATE_LIMITER);
      const name = validateName((await readJson(request)).name);
      const token = randomToken();
      const tokenHash = await hashToken(token);
      for (let attempt = 0; attempt < 5; attempt++) {
        const code = randomCode();
        const result = await env.ROOMS.getByName(code).initialize(
          code,
          name,
          tokenHash,
        );
        if (!result) continue;
        return Response.json(
          { code, you: result.you },
          {
            status: 201,
            headers: {
              "Set-Cookie": sessionCookie(request, code, token),
              "Cache-Control": "no-store",
            },
          },
        );
      }
      throw new RoomError(
        "ROOM_UNAVAILABLE",
        "Could not create a room. Try again.",
        503,
      );
    }
    const match = /^\/api\/rooms\/([^/]+)\/(join|session|socket)$/.exec(path);
    if (!match)
      throw new RoomError("NOT_FOUND", "That endpoint does not exist.", 404);
    const code = normalizeCode(match[1]!);
    const action = match[2]!;
    const expectedMethod = action === "join" ? "POST" : "GET";
    if (request.method !== expectedMethod)
      throw new RoomError(
        "METHOD_NOT_ALLOWED",
        "That method is not supported.",
        405,
      );
    if (action !== "session") requireOrigin(request);
    await limit(request, env.JOIN_LIMITER);
    let token = readToken(request, code);
    if (action !== "join" && !token)
      throw new RoomError(
        "UNAUTHORIZED",
        "Enter your name to join the room.",
        401,
      );
    const body = action === "join" ? await readJson(request) : undefined;
    const joinBody = body
      ? body.spectator === true
        ? { spectator: true }
        : { name: validateName(body.name) }
      : undefined;
    token ??= randomToken();
    const headers = new Headers();
    headers.set("x-bzzr-token-hash", await hashToken(token));
    if (action === "socket") {
      if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
        throw new RoomError(
          "UPGRADE_REQUIRED",
          "A WebSocket connection is required.",
          426,
        );
      }
      headers.set("Upgrade", "websocket");
    }
    if (joinBody) headers.set("Content-Type", "application/json");
    const forwarded = new Request(`https://room.internal/${action}`, {
      method: expectedMethod,
      headers,
      ...(joinBody ? { body: JSON.stringify(joinBody) } : {}),
    });
    const response = await env.ROOMS.getByName(code).fetch(forwarded);
    if (action === "socket" || !response.ok) return response;
    const outgoing = new Response(response.body, response);
    outgoing.headers.set("Cache-Control", "no-store");
    if (action === "join")
      outgoing.headers.set("Set-Cookie", sessionCookie(request, code, token));
    return outgoing;
  } catch (error) {
    // Request bodies and capabilities are intentionally excluded from logs.
    if (!(error instanceof RoomError)) console.error("room_api_failed");
    return jsonError(error);
  }
}
