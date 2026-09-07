import { AppShell } from "../components/AppShell";
import { Lobby } from "../components/Lobby";

export function Home() {
  return (
    <AppShell>
      <div className="grid items-center gap-12 py-4 lg:grid-cols-2 lg:gap-20 lg:py-8">
        <div>
          <p className="mb-7 inline-flex rounded-full border border-zinc-950/10 px-3 py-1.5 text-xs font-semibold dark:border-white/10">
            The buzzer for your next trivia night
          </p>
          <h1 className="text-6xl font-semibold leading-[1.05] tracking-tight sm:text-7xl">
            First in.
            <br />
            <span className="text-lime-700 dark:text-lime-300">Game on.</span>
          </h1>
          <p className="mt-7 max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Less “I said it first.” More playing.
            <br />
            One room code. A buzzer for everyone. A clear order when it counts.
          </p>
          <ol className="mt-10 space-y-4 text-sm">
            {[
              ["01", "Start a room", "One of you takes the host controls."],
              ["02", "Bring your people", "Share the link or the room code."],
              [
                "03",
                "Beat them to the buzz",
                "The host resets. Everyone gets another shot.",
              ],
            ].map(([number, title, text]) => (
              <li key={number} className="flex items-start gap-4">
                <span
                  aria-hidden="true"
                  className="mt-0.5 font-mono text-xs font-bold text-lime-700 dark:text-lime-300"
                >
                  {number}
                </span>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                    {text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-9 max-w-md text-xs leading-5 text-zinc-500 dark:text-zinc-400">
            Bring your own questions and keep your favorite video call open.
            We’ll take care of the buzzer.
          </p>
        </div>
        <Lobby />
      </div>
    </AppShell>
  );
}
