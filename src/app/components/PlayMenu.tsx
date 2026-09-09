"use client";

import { useState } from "react";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";

export function PlayMenu({
  code,
  leftHanded,
  onToggle,
}: {
  code: string;
  leftHanded: boolean;
  onToggle: () => void;
}) {
  const [copyState, setCopyState] = useState<{
    kind: "code" | "link";
    status: "copied" | "manual";
    value: string;
  } | null>(null);
  async function copy(kind: "code" | "link") {
    const value =
      kind === "code" ? code : window.location.origin + "/room/" + code;
    try {
      await navigator.clipboard.writeText(value);
      setCopyState({ kind, status: "copied", value });
    } catch {
      setCopyState({ kind, status: "manual", value });
    }
  }
  return (
    <Popover className="relative">
      <PopoverButton
        aria-label="Room menu"
        className="grid size-11 place-items-center border-2 border-zinc-950 bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600 dark:border-zinc-400 dark:bg-zinc-900"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className="size-6"
        >
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      </PopoverButton>
      <PopoverPanel
        focus
        aria-label="Room options"
        className="absolute right-0 z-20 mt-3 w-72 max-w-[calc(100vw-2rem)] border-2 border-zinc-950 bg-white p-3 shadow-pink dark:border-zinc-400 dark:bg-zinc-900"
      >
        {(["code", "link"] as const).map((kind) => (
          <button
            key={kind}
            type="button"
            onClick={() => copy(kind)}
            className="min-h-12 w-full px-2 text-left text-sm font-bold hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-blue-600 dark:hover:bg-zinc-800"
          >
            {copyState?.kind === kind && copyState.status === "copied"
              ? `Room ${kind} copied ✓`
              : `Copy room ${kind}`}
          </button>
        ))}
        <p aria-live="polite" className="sr-only">
          {copyState?.status === "copied"
            ? `Room ${copyState.kind} copied to clipboard.`
            : ""}
        </p>
        {copyState?.status === "manual" && (
          <label className="block px-2 pb-3 text-xs">
            Copy this room {copyState.kind}
            <input
              readOnly
              value={copyState.value}
              onFocus={(event) => event.target.select()}
              className="mt-2 w-full border-2 border-zinc-500 bg-transparent p-2 font-mono text-base"
            />
          </label>
        )}
        <button
          type="button"
          role="switch"
          aria-checked={leftHanded}
          onClick={onToggle}
          className="flex min-h-16 w-full items-center justify-between gap-2 border-t border-zinc-300 px-2 py-3 text-left text-sm font-bold focus-visible:outline-2 focus-visible:outline-blue-600 dark:border-zinc-600"
        >
          <span>Left-handed mode</span>
          <span
            aria-hidden="true"
            className={`flex h-9 w-20 shrink-0 items-center border-2 border-zinc-950 p-1 dark:border-zinc-400 ${leftHanded ? "flex-row-reverse bg-lime-300" : "bg-zinc-200 dark:bg-zinc-800"}`}
          >
            <span className="h-full w-6 border border-zinc-950 bg-white" />
            <span
              className={`flex-1 text-center font-mono text-xs ${leftHanded ? "text-zinc-950" : ""}`}
            >
              {leftHanded ? "ON" : "OFF"}
            </span>
          </span>
        </button>
      </PopoverPanel>
    </Popover>
  );
}
