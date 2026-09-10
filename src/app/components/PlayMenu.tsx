"use client";

import { useState } from "react";
import { HandednessSwitch } from "./HandednessSwitch";
import {
  Alert,
  AlertTitle,
  AlertDescription,
  AlertActions,
} from "./catalyst/alert";
import { Button } from "./catalyst/button";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";

export function PlayMenu({
  code,
  leftHanded,
  onToggle,
  onEnd,
  endDisabled = false,
}: {
  code: string;
  leftHanded: boolean;
  onToggle: () => void;
  onEnd?: () => void;
  endDisabled?: boolean;
}) {
  const [confirmEnd, setConfirmEnd] = useState(false);
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
    <>
      <Popover className="relative">
        {({ close }) => (
          <>
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
              <HandednessSwitch leftHanded={leftHanded} onToggle={onToggle} />
              {onEnd && (
                <button
                  type="button"
                  disabled={endDisabled}
                  onClick={() => {
                    close();
                    setConfirmEnd(true);
                  }}
                  className="min-h-12 w-full border-t border-zinc-300 px-2 text-left text-sm font-bold text-red-700 enabled:hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-40 dark:border-zinc-600 dark:text-red-400 dark:enabled:hover:bg-red-950"
                >
                  End room
                </button>
              )}
            </PopoverPanel>
          </>
        )}
      </Popover>
      <Alert open={confirmEnd} onClose={setConfirmEnd}>
        <AlertTitle>End this room?</AlertTitle>
        <AlertDescription>
          Everyone will be disconnected and the names and buzz order will be
          cleared.
        </AlertDescription>
        <AlertActions>
          <Button plain onClick={() => setConfirmEnd(false)}>
            Keep playing
          </Button>
          <Button
            color="red"
            disabled={endDisabled || !onEnd}
            onClick={() => {
              setConfirmEnd(false);
              onEnd?.();
            }}
          >
            End room for everyone
          </Button>
        </AlertActions>
      </Alert>
    </>
  );
}
