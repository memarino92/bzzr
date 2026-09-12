"use client";

import { useRoom } from "../hooks/useRoom";
import { EntryForm } from "./EntryForm";
import { RoomView } from "./RoomView";
import { RoomNotice } from "./RoomNotice";
import { AppShell } from "./AppShell";

export function RoomClient({
  code,
  spectating = false,
}: {
  code: string;
  spectating?: boolean;
}) {
  const state = useRoom(code, spectating);
  if (state.phase === "removed" || state.phase === "banned")
    return (
      <AppShell>
        <RoomNotice kind={state.phase} roomCode={code} />
      </AppShell>
    );
  if (state.phase === "left")
    return (
      <AppShell>
        <RoomNotice kind="left" roomCode={code} />
      </AppShell>
    );
  if (state.phase === "loading")
    return (
      <AppShell>
        <RoomNotice kind="loading" />
      </AppShell>
    );
  if (state.phase === "ended")
    return (
      <AppShell>
        <RoomNotice kind={state.reason === "closed" ? "closed" : "expired"} />
      </AppShell>
    );
  if (state.phase === "error")
    return (
      <AppShell>
        <RoomNotice kind="error" message={state.error} onRetry={state.retry} />
      </AppShell>
    );
  if (state.phase === "join")
    return (
      <AppShell>
        <div className="game-panel mx-auto max-w-md p-8 shadow-pink">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            You’re invited
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">
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
            onSubmit={(name) => state.join(name)}
            onSpectate={() => window.location.assign(`/room/${code}/spectate`)}
          />
        </div>
      </AppShell>
    );
  if (!state.session) return null;
  return (
    <RoomView
      {...state.session}
      spectating={spectating}
      connection={state.connection}
      pending={state.pending}
      error={state.error}
      onCommand={state.send}
      onRetry={state.retry}
      onLeave={state.leave}
      leaving={state.busy}
    />
  );
}
