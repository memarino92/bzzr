"use client";

import { useRoom } from "../hooks/useRoom";
import { EntryForm } from "./EntryForm";
import { RoomView } from "./RoomView";
import { RoomNotice } from "./RoomNotice";

export function RoomClient({ code }: { code: string }) {
  const state = useRoom(code);
  if (state.phase === "loading") return <RoomNotice kind="loading" />;
  if (state.phase === "ended")
    return (
      <RoomNotice kind={state.reason === "closed" ? "closed" : "expired"} />
    );
  if (state.phase === "error")
    return (
      <RoomNotice kind="error" message={state.error} onRetry={state.retry} />
    );
  if (state.phase === "join")
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-zinc-950/10 bg-white p-8 dark:border-white/10 dark:bg-zinc-900">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
          You’re invited
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Join room <span className="font-mono">{code}</span>
        </h1>
        <p className="mt-3 mb-8 text-sm text-zinc-500 dark:text-zinc-400">
          Introduce yourself, then get ready to buzz.
        </p>
        <EntryForm
          mode="join"
          roomCode={code}
          busy={state.busy}
          error={state.error}
          onSubmit={state.join}
        />
      </div>
    );
  if (!state.session) return null;
  return (
    <RoomView
      {...state.session}
      connection={state.connection}
      pending={state.pending}
      error={state.error}
      onCommand={state.send}
      onRetry={state.retry}
    />
  );
}
