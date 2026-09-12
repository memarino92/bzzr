import { DurableObject } from "cloudflare:workers";
import {
  addPlayer,
  addSpectator,
  applyCommand,
  createRoom,
  ensureLive,
  expiresAt,
  leaveRoom,
  snapshot,
  type Member,
  type RoomState,
} from "../domain/room";
import {
  LIMITS,
  RoomError,
  parseCommand,
  type ServerMessage,
} from "../domain/protocol";
import { jsonError, readJson } from "./http";

interface Attachment {
  playerId: string;
  windowStart: number;
  messages: number;
}

/** One coordination authority per room. No global directory or running timers. */
export class BuzzerRoom extends DurableObject {
  private room: RoomState | undefined;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      this.room = await ctx.storage.get<RoomState>("room");
    });
    // Transport health replies do not wake the object or extend the room lifetime.
    ctx.setWebSocketAutoResponse(
      new WebSocketRequestResponsePair("ping", "pong"),
    );
  }

  async initialize(
    code: string,
    name: string,
    tokenHash: string,
  ): Promise<{ you: string } | null> {
    if (this.room) {
      if (Date.now() < expiresAt(this.room)) return null;
      await this.destroy("expired");
    }
    const host: Member = {
      id: crypto.randomUUID(),
      name,
      tokenHash,
      isHost: true,
    };
    await this.save(createRoom(code, host, Date.now()));
    return { you: host.id };
  }

  private async live(): Promise<RoomState> {
    if (!this.room)
      throw new RoomError(
        "ROOM_NOT_FOUND",
        "This room has ended or does not exist.",
        404,
      );
    try {
      ensureLive(this.room, Date.now());
      return this.room;
    } catch (error) {
      await this.destroy("expired");
      throw error;
    }
  }

  private async save(room: RoomState): Promise<void> {
    this.room = room;
    await this.ctx.storage.put("room", room);
    await this.ctx.storage.setAlarm(expiresAt(room));
  }

  private online(except?: WebSocket): Set<string> {
    return new Set(
      this.ctx
        .getWebSockets()
        .filter((ws) => ws !== except && ws.readyState === WebSocket.OPEN)
        .map((ws) => (ws.deserializeAttachment() as Attachment).playerId),
    );
  }

  private send(ws: WebSocket, message: ServerMessage): void {
    try {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(message));
    } catch {
      // One broken client must not prevent delivery to the rest of the room.
      try {
        ws.close(1011, "Reconnect to the room");
      } catch {
        /* already closed */
      }
    }
  }

  private broadcast(except?: WebSocket): void {
    if (!this.room) return;
    const room = snapshot(this.room, this.online(except));
    for (const ws of this.ctx.getWebSockets()) {
      if (ws === except) continue;
      const attachment = ws.deserializeAttachment() as Attachment;
      if (
        ![...this.room.players, ...(this.room.spectators ?? [])].some(
          (member) => member.id === attachment.playerId,
        )
      )
        continue;
      this.send(ws, { type: "snapshot", room, you: attachment.playerId });
    }
  }

  async fetch(request: Request): Promise<Response> {
    try {
      const room = await this.live();
      const tokenHash = request.headers.get("x-bzzr-token-hash");
      const members = (state: RoomState) => [
        ...state.players,
        ...(state.spectators ?? []),
      ];
      let player = members(room).find((p) => p.tokenHash === tokenHash);
      const path = new URL(request.url).pathname;
      if (path === "/join" && request.method === "POST") {
        if (!tokenHash || !/^[a-f0-9]{64}$/.test(tokenHash))
          throw new RoomError("UNAUTHORIZED", "Join through bzzr.", 401);
        if (!player) {
          const body = await readJson(request);
          // Read the latest state after the non-storage await above.
          const current = await this.live();
          player = members(current).find((p) => p.tokenHash === tokenHash);
          if (!player) {
            const member = {
              id: crypto.randomUUID(),
              name: String(body.name ?? ""),
              tokenHash,
              isHost: false,
            };
            player = member;
            await this.save(
              body.spectator === true
                ? addSpectator(
                    current,
                    { id: member.id, tokenHash },
                    Date.now(),
                  )
                : addPlayer(current, member, Date.now()),
            );
            this.broadcast();
          }
        }
        return Response.json({
          room: snapshot(this.room!, this.online()),
          you: player.id,
        });
      }
      if (path === "/leave" && request.method === "POST") {
        if (!tokenHash || !/^[a-f0-9]{64}$/.test(tokenHash))
          throw new RoomError("UNAUTHORIZED", "Join through bzzr.", 401);
        if (!player) return Response.json({ ok: true });
        const next = leaveRoom(room, player.id, Date.now());
        if (next) await this.save(next);
        else {
          this.room = undefined;
          await this.ctx.storage.deleteAll();
        }
        for (const ws of this.ctx.getWebSockets(player.id)) {
          this.send(ws, { type: "left" });
          try {
            ws.close(4005, "left");
          } catch {
            /* already closed */
          }
        }
        if (next) this.broadcast();
        else await this.destroy("closed");
        return Response.json({ ok: true });
      }
      if (!player)
        throw new RoomError(
          "UNAUTHORIZED",
          "Enter your name to join the room.",
          401,
        );
      if (path === "/session" && request.method === "GET") {
        return Response.json({
          room: snapshot(room, this.online()),
          you: player.id,
        });
      }
      if (
        path === "/socket" &&
        request.method === "GET" &&
        request.headers.get("Upgrade")?.toLowerCase() === "websocket"
      ) {
        const previous = this.ctx
          .getWebSockets(player.id)
          .filter((ws) => ws.readyState === WebSocket.OPEN);
        if (previous.length >= LIMITS.socketsPerPlayer) {
          throw new RoomError(
            "TOO_MANY_CONNECTIONS",
            "Close another tab for this room, then retry.",
            429,
          );
        }
        const pair = new WebSocketPair();
        const [client, server] = [pair[0], pair[1]];
        this.ctx.acceptWebSocket(server, [player.id]);
        server.serializeAttachment({
          playerId: player.id,
          windowStart: Date.now(),
          messages: 0,
        } satisfies Attachment);
        this.broadcast();
        return new Response(null, { status: 101, webSocket: client });
      }
      throw new RoomError("NOT_FOUND", "That endpoint does not exist.", 404);
    } catch (error) {
      return jsonError(error);
    }
  }

  async webSocketMessage(
    ws: WebSocket,
    message: string | ArrayBuffer,
  ): Promise<void> {
    try {
      const attachment = ws.deserializeAttachment() as Attachment;
      const now = Date.now();
      if (now - attachment.windowStart >= LIMITS.messageWindowMs) {
        attachment.windowStart = now;
        attachment.messages = 0;
      }
      attachment.messages += 1;
      ws.serializeAttachment(attachment);
      if (attachment.messages > LIMITS.messagesPerWindow) {
        ws.close(1008, "Too many commands; reconnect shortly");
        return;
      }
      if (
        typeof message !== "string" ||
        new TextEncoder().encode(message).byteLength > LIMITS.messageBytes
      ) {
        ws.close(1009, "Commands must be small text messages");
        return;
      }
      let input: unknown;
      try {
        input = JSON.parse(message);
      } catch {
        throw new RoomError(
          "INVALID_COMMAND",
          "That command could not be read.",
        );
      }
      const command = parseCommand(input);
      const room = await this.live();
      const next = applyCommand(room, attachment.playerId, command, now);
      if (!next) {
        await this.destroy("closed");
        return;
      }
      if (next !== room) await this.save(next);
      // Even a duplicate receives confirmation; the domain does not write again.
      this.broadcast();
    } catch (error) {
      const known = error instanceof RoomError;
      this.send(ws, {
        type: "error",
        code: known ? error.code : "INTERNAL_ERROR",
        message: known
          ? error.message
          : "Could not process that command. Reconnect and try again.",
      });
    }
  }

  webSocketClose(ws: WebSocket, code: number, reason: string): void {
    ws.close(code === 1005 || code === 1006 ? 1000 : code, reason);
    this.broadcast(ws);
  }

  webSocketError(ws: WebSocket): void {
    try {
      ws.close(1011, "Reconnect to the room");
    } catch {
      /* already closed */
    }
    this.broadcast(ws);
  }

  async alarm(): Promise<void> {
    if (!this.room || Date.now() >= expiresAt(this.room)) {
      await this.destroy("expired");
    } else {
      // Alarms may be delivered late, retried, or superseded by fresh activity.
      await this.ctx.storage.setAlarm(expiresAt(this.room));
    }
  }

  private async destroy(reason: "closed" | "expired"): Promise<void> {
    this.room = undefined;
    for (const ws of this.ctx.getWebSockets()) {
      this.send(ws, { type: "ended", reason });
      try {
        ws.close(4004, reason);
      } catch {
        /* already closed */
      }
    }
    await this.ctx.storage.deleteAll();
  }
}
