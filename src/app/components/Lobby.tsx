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
      className="rounded-2xl border border-zinc-950/10 bg-white p-6 shadow-sm sm:p-8 dark:border-white/10 dark:bg-zinc-900"
    >
      <div className="mb-8 grid grid-cols-2 gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
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
            className={`rounded-lg px-3 py-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-lime-600 ${mode === value ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-700 dark:text-white" : "text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"}`}
          >
            {value === "host" ? "Host a room" : "Join an existing room"}
          </button>
        ))}
      </div>
      <h2 className="mb-2 text-xl font-semibold tracking-tight">
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
