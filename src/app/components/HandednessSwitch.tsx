"use client";

export function HandednessSwitch({
  leftHanded,
  onToggle,
}: {
  leftHanded: boolean;
  onToggle: () => void;
}) {
  return (
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
  );
}
