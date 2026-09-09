"use client";

import { useState } from "react";
import { EntryForm } from "./EntryForm";
import { postJson } from "../lib/api-client";

export function Lobby() {
  const [mode, setMode] = useState<"host" | "join">("host");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(name: string, code?: string) {
    setBusy(true);
    setError("");
    try {
      if (mode === "host") {
        const result = await postJson<{ code: string }>("/api/rooms", { name });
        window.location.assign("/room/" + result.code);
      } else {
        await postJson("/api/rooms/" + code + "/join", { name });
        window.location.assign("/room/" + code);
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not connect. Please try again.",
      );
      setBusy(false);
    }
  }
  return (
    <section
      aria-label="Get started"
      className="game-panel relative isolate p-6 shadow-pink before:absolute before:-inset-1 before:-z-10 before:rotate-2 before:border-2 before:border-zinc-950 before:bg-cyan-300 before:content-[''] after:absolute after:inset-0 after:-z-10 after:bg-white sm:p-8 dark:after:bg-zinc-900"
    >
      <div className="mb-8 grid grid-cols-2 gap-2 border-b-2 border-zinc-950 pb-5 dark:border-zinc-300">
        {(["host", "join"] as const).map((value) => (
          <button
            key={value}
            type="button"
            disabled={busy}
            aria-pressed={mode === value}
            onClick={() => {
              setMode(value);
              setError("");
            }}
            className={`border-2 border-zinc-950 px-3 py-3 text-sm font-black focus-visible:outline-2 focus-visible:outline-lime-600 ${mode === value ? "bg-lime-300 text-zinc-950 shadow-ink" : "bg-zinc-100 text-zinc-600 hover:bg-cyan-100 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"}`}
          >
            {value === "host" ? "Host a room" : "Join an existing room"}
          </button>
        ))}
      </div>
      <h2 className="mb-2 text-xl font-bold tracking-tight">
        {mode === "host"
          ? "Your room. Your rules."
          : "Your people are waiting."}
      </h2>
      <p className="mb-7 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
        {mode === "host"
          ? "Get everyone together. We’ll handle who was first."
          : "A name and a room code. That’s all you need."}
      </p>
      <EntryForm
        key={mode}
        mode={mode}
        busy={busy}
        error={error}
        onSubmit={submit}
      />
      <p className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
        No account. No download. Up to 60 people.
      </p>
    </section>
  );
}
