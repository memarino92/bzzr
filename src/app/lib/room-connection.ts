import type { Command, ServerMessage } from "../../domain/protocol";
import type { Connection } from "../components/RoomView";
import { ApiError, readResponse } from "./api-client";

interface Callbacks {
  message: (message: ServerMessage) => void;
  status: (status: Connection) => void;
  sessionLost: (error: ApiError) => void;
}

/** Owns a single socket and all browser timers. Never queues or replays buzzes. */
export class RoomConnection {
  private socket?: WebSocket;
  private stopped = false;
  private attempts = 0;
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private heartbeat?: ReturnType<typeof setInterval>;
  private deadline?: ReturnType<typeof setTimeout>;
  private pendingPing = false;

  constructor(
    private code: string,
    private callbacks: Callbacks,
  ) {}

  start(): void {
    window.addEventListener("online", this.online);
    window.addEventListener("offline", this.offline);
    this.connect();
  }

  private online = (): void => {
    if (
      this.socket?.readyState === WebSocket.OPEN ||
      this.socket?.readyState === WebSocket.CONNECTING
    )
      return;
    clearTimeout(this.reconnectTimer);
    this.attempts = 0;
    this.connect();
  };

  private offline = (): void => {
    this.callbacks.status("reconnecting");
    this.socket?.close(4000, "Offline");
  };

  private clearHealth(): void {
    clearInterval(this.heartbeat);
    clearTimeout(this.deadline);
    this.pendingPing = false;
  }

  private connect(): void {
    if (this.stopped) return;
    this.callbacks.status(this.attempts ? "reconnecting" : "connecting");
    const url = new URL(
      "/api/rooms/" + this.code + "/socket",
      window.location.origin,
    );
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    const socket = new WebSocket(url);
    this.socket = socket;
    this.deadline = setTimeout(
      () => socket.close(4000, "Connection timed out"),
      10_000,
    );
    socket.onopen = () => {
      if (this.stopped || this.socket !== socket) return;
      clearTimeout(this.deadline);
      this.heartbeat = setInterval(() => {
        if (socket.readyState !== WebSocket.OPEN) return;
        if (this.pendingPing) {
          socket.close(4000, "Connection timed out");
          return;
        }
        this.pendingPing = true;
        socket.send("ping");
        this.deadline = setTimeout(() => {
          if (this.pendingPing) socket.close(4000, "Connection timed out");
        }, 10_000);
      }, 25_000);
    };
    socket.onmessage = (event) => {
      if (this.stopped || this.socket !== socket) return;
      this.pendingPing = false;
      clearTimeout(this.deadline);
      if (event.data === "pong") return;
      try {
        const message = JSON.parse(String(event.data)) as ServerMessage;
        if (message.type === "snapshot") {
          this.attempts = 0;
          this.callbacks.status("connected");
        }
        this.callbacks.message(message);
      } catch {
        socket.close(4000, "Could not read room update");
      }
    };
    socket.onclose = (event) => {
      if (this.stopped || this.socket !== socket) return;
      this.clearHealth();
      if (event.code === 4004) {
        this.callbacks.message({
          type: "ended",
          reason: event.reason === "closed" ? "closed" : "expired",
        });
        return;
      }
      this.callbacks.status("reconnecting");
      if (event.code === 1008 || event.code === 1009 || this.attempts >= 8) {
        this.callbacks.status("failed");
        return;
      }
      // Failed upgrades have no readable HTTP body in the browser; check the
      // session endpoint so expired rooms and lost cookies get actionable UI.
      void this.recover(socket);
    };
  }

  private async recover(closedSocket: WebSocket): Promise<void> {
    try {
      await readResponse(
        await fetch("/api/rooms/" + this.code + "/session", {
          credentials: "same-origin",
        }),
      );
    } catch (error) {
      if (this.stopped || this.socket !== closedSocket) return;
      if (error instanceof ApiError && [401, 404, 410].includes(error.status)) {
        this.callbacks.sessionLost(error);
        return;
      }
    }
    if (this.stopped || this.socket !== closedSocket) return;
    this.attempts += 1;
    const delay =
      Math.min(15_000, 500 * 2 ** (this.attempts - 1)) + Math.random() * 500;
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }

  send(command: Command): boolean {
    if (this.stopped || this.socket?.readyState !== WebSocket.OPEN)
      return false;
    try {
      this.socket.send(JSON.stringify(command));
      return true;
    } catch {
      this.socket.close(4000, "Send failed");
      return false;
    }
  }

  stop(): void {
    this.stopped = true;
    clearTimeout(this.reconnectTimer);
    this.clearHealth();
    window.removeEventListener("online", this.online);
    window.removeEventListener("offline", this.offline);
    this.socket?.close(1000, "Leaving page");
  }
}
