"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import type { Command, SessionResponse } from "../../domain/protocol";
import type { Connection } from "../components/RoomView";
import { ApiError, postJson, readResponse } from "../lib/api-client";
import { RoomConnection } from "../lib/room-connection";

interface State {
  phase: "loading" | "join" | "live" | "ended" | "error" | "left";
  session?: SessionResponse;
  connection: Connection;
  error: string;
  pending: boolean;
  busy: boolean;
  reason?: "closed" | "expired";
  generation: number;
}
type Action =
  | { type: "left" }
  | { type: "session"; session: SessionResponse }
  | { type: "connection"; connection: Connection }
  | { type: "failure"; error: string; phase?: State["phase"] }
  | { type: "join" }
  | { type: "busy" }
  | { type: "pending" }
  | { type: "ended"; reason: "closed" | "expired" }
  | { type: "retry" };

const initial: State = {
  phase: "loading",
  connection: "connecting",
  error: "",
  pending: false,
  busy: false,
  generation: 0,
};
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "left":
      return {
        ...state,
        phase: "left",
        session: undefined,
        busy: false,
        pending: false,
        error: "",
      };
    case "session":
      return {
        ...state,
        phase: "live",
        session: action.session,
        pending: false,
        busy: false,
        error: "",
      };
    case "connection":
      return { ...state, connection: action.connection, pending: false };
    case "failure":
      return {
        ...state,
        phase: action.phase ?? state.phase,
        error: action.error,
        pending: false,
        busy: false,
      };
    case "join":
      return {
        ...state,
        phase: "join",
        session: undefined,
        pending: false,
        busy: false,
      };
    case "busy":
      return { ...state, busy: true, error: "" };
    case "pending":
      return { ...state, pending: true, error: "" };
    case "ended":
      return {
        ...state,
        phase: "ended",
        reason: action.reason,
        session: undefined,
        pending: false,
      };
    case "retry":
      return { ...initial, generation: state.generation + 1 };
  }
}

export function useRoom(code: string, spectating = false) {
  const [state, dispatch] = useReducer(reducer, initial);
  const transport = useRef<RoomConnection | null>(null);
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const handleFailure = useCallback((error: unknown) => {
    if (error instanceof ApiError && error.status === 401)
      dispatch({ type: "join" });
    else if (error instanceof ApiError && [404, 410].includes(error.status))
      dispatch({ type: "ended", reason: "expired" });
    else
      dispatch({
        type: "failure",
        phase: "error",
        error:
          error instanceof Error
            ? error.message
            : "Could not connect to the room.",
      });
  }, []);

  useEffect(() => {
    const abort = new AbortController();
    void fetch("/api/rooms/" + code + "/session", {
      credentials: "same-origin",
      signal: abort.signal,
    })
      .then(readResponse<SessionResponse>)
      .catch((error: unknown) => {
        if (
          spectating &&
          error instanceof ApiError &&
          error.status === 401 &&
          !abort.signal.aborted
        )
          return fetch("/api/rooms/" + code + "/join", {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ spectator: true }),
            signal: abort.signal,
          }).then(readResponse<SessionResponse>);
        throw error;
      })
      .then((session) => {
        if (!abort.signal.aborted) dispatch({ type: "session", session });
      })
      .catch((error: unknown) => {
        if (!abort.signal.aborted) handleFailure(error);
      });
    return () => abort.abort();
  }, [code, spectating, state.generation, handleFailure]);

  const you = state.session?.you;
  const live = state.phase === "live";
  useEffect(() => {
    if (!you || !live) return;
    const connection = new RoomConnection(code, {
      status: (value) => dispatch({ type: "connection", connection: value }),
      sessionLost: handleFailure,
      message: (message) => {
        clearTimeout(pendingTimer.current);
        if (message.type === "left") {
          transport.current?.stop();
          dispatch({ type: "left" });
          return;
        }
        if (message.type === "snapshot")
          dispatch({
            type: "session",
            session: { room: message.room, you: message.you },
          });
        else if (message.type === "ended")
          dispatch({ type: "ended", reason: message.reason });
        else if (message.type === "error")
          dispatch({ type: "failure", error: message.message });
      },
    });
    transport.current = connection;
    connection.start();
    return () => {
      clearTimeout(pendingTimer.current);
      connection.stop();
      transport.current = null;
    };
  }, [code, you, live, state.generation, handleFailure]);

  async function join(name: string, spectator = false): Promise<void> {
    dispatch({ type: "busy" });
    try {
      const session = await postJson<SessionResponse>(
        "/api/rooms/" + code + "/join",
        spectator ? { spectator: true } : { name },
      );
      dispatch({ type: "session", session });
    } catch (error) {
      if (error instanceof ApiError && [404, 410].includes(error.status))
        handleFailure(error);
      else
        dispatch({
          type: "failure",
          error:
            error instanceof Error ? error.message : "Could not join the room.",
        });
    }
  }

  function send(command: Command): void {
    if (spectating) return;
    if (state.pending || state.connection !== "connected") return;
    if (!transport.current?.send(command)) {
      dispatch({
        type: "failure",
        error: "You’re disconnected. Reconnect before buzzing.",
      });
      return;
    }
    dispatch({ type: "pending" });
    clearTimeout(pendingTimer.current);
    pendingTimer.current = setTimeout(() => {
      dispatch({
        type: "failure",
        error:
          "Confirmation is taking too long. Your buzz may have arrived; reconnect to check.",
        phase: "error",
      });
    }, 8000);
  }

  async function leave(): Promise<void> {
    if (state.busy) return;
    dispatch({ type: "busy" });
    try {
      await postJson("/api/rooms/" + code + "/leave", {});
      clearTimeout(pendingTimer.current);
      transport.current?.stop();
      dispatch({ type: "left" });
    } catch (error) {
      if (error instanceof ApiError && [401, 404, 410].includes(error.status)) {
        transport.current?.stop();
        dispatch({ type: "left" });
      } else
        dispatch({
          type: "failure",
          error:
            error instanceof Error
              ? error.message
              : "Could not leave the room. Try again.",
        });
    }
  }

  return {
    ...state,
    join,
    send,
    leave,
    retry: () => dispatch({ type: "retry" }),
  };
}
