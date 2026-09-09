import type { ReactNode } from "react";
import { ThemeToggle } from "./ThemeToggle";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only z-50 rounded-none bg-lime-300 p-3 text-zinc-950 focus:not-sr-only focus:absolute"
      >
        Skip to content
      </a>
      <header className="border-b-2 border-zinc-950 dark:border-zinc-300">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <a
            href="/"
            aria-label="bzzr home"
            className="flex items-center gap-2.5 rounded-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime-600"
          >
            <span
              aria-hidden="true"
              className="grid size-9 -rotate-6 place-items-center border-2 border-zinc-950 bg-lime-300 shadow-pink font-black text-zinc-950"
            >
              b.
            </span>
            <span className="text-2xl font-black tracking-tight">
              bzzr<span className="text-lime-700 dark:text-lime-300">.</span>
            </span>
          </a>
          <div className="flex items-center gap-4">
            <span className="hidden text-right font-mono text-xs font-bold uppercase sm:block text-zinc-500 dark:text-zinc-400">
              Good company. Quick reflexes.
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main
        id="main"
        className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:px-8 sm:py-16"
      >
        {children}
      </main>
      <footer className="mx-auto flex w-full max-w-6xl flex-wrap border-t-2 border-zinc-950 dark:border-zinc-300 items-center justify-between gap-3 px-5 py-6 text-xs text-zinc-500 sm:px-8 dark:text-zinc-400">
        <p>A little friendly competition.</p>
        <a
          className="rounded-none underline decoration-zinc-300 underline-offset-4 hover:text-zinc-950 dark:hover:text-white"
          href="https://github.com/memarino92/bzzr"
        >
          Made in the open ↗
        </a>
      </footer>
    </div>
  );
}
