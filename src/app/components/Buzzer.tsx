"use client";

export interface BuzzerProps {
  open: boolean;
  connected: boolean;
  pending?: boolean;
  position?: number;
  onBuzz: () => void;
}

export function Buzzer({
  open,
  connected,
  pending = false,
  position,
  onBuzz,
}: BuzzerProps) {
  const disabled = !open || !connected || pending || position !== undefined;
  const label = !connected
    ? "Reconnecting…"
    : position
      ? "You’re in!"
      : pending
        ? "Sending…"
        : open
          ? "BUZZ"
          : "Hold tight";
  const help = !connected
    ? "We’ll reconnect automatically. Buzzing is paused."
    : position
      ? `Position #${position}. Wait for the next round.`
      : pending
        ? "Waiting for the room to confirm."
        : open
          ? "Tap the button. Make your move."
          : "Your host will open buzzing when it’s time.";
  return (
    <div className="flex flex-col items-center py-6 sm:py-10">
      <button
        type="button"
        aria-label="Buzz in"
        disabled={disabled}
        onClick={onBuzz}
        className={`flex aspect-square w-60 max-w-full flex-col items-center justify-center rounded-full border-[10px] text-zinc-950 shadow-[0_12px_0_0_var(--color-zinc-300)] transition duration-150 focus-visible:outline-4 focus-visible:outline-offset-8 focus-visible:outline-lime-700 enabled:cursor-pointer enabled:active:translate-y-2 enabled:active:shadow-none motion-reduce:transition-none sm:w-72 dark:shadow-[0_12px_0_0_var(--color-zinc-700)] ${position ? "border-lime-200 bg-lime-100" : disabled ? "border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" : "border-lime-200 bg-lime-300 hover:bg-lime-200"}`}
      >
        <span className="text-3xl font-black tracking-tight sm:text-4xl">
          {label}
        </span>
        {position !== undefined && (
          <span className="mt-2 font-mono text-2xl font-semibold">
            #{position}
          </span>
        )}
        {open && connected && !position && !pending && (
          <span
            aria-hidden="true"
            className="mt-2 font-mono text-xs tracking-widest"
          >
            FIRST IN. GAME ON.
          </span>
        )}
      </button>
      <p
        role="status"
        className="mt-8 text-center text-sm text-zinc-600 dark:text-zinc-400"
      >
        {help}
      </p>
      <p className="mt-2 text-center text-xs text-zinc-500 dark:text-zinc-400">
        Keyboard: focus the buzzer, then press Space or Enter.
      </p>
    </div>
  );
}
