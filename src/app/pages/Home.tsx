import { AppShell } from "../components/AppShell";
import { Lobby } from "../components/Lobby";

export function Home() {
  return (
    <AppShell>
      <div className="grid items-center gap-14 py-4 lg:grid-cols-2 lg:gap-20 lg:py-8">
        <div>
          <p className="mb-8 inline-flex -rotate-2 border-2 border-zinc-950 bg-cyan-300 px-3 py-2 font-mono text-xs font-bold uppercase text-zinc-950 shadow-ink">
            The buzzer for your next trivia night
          </p>
          <h1 className="text-6xl font-black uppercase leading-[0.95] tracking-tighter sm:text-7xl xl:text-[5rem]">
            First in.
            <br />
            <span className="mt-3 inline-block -rotate-3 bg-lime-300 px-2 pb-1 text-zinc-950 shadow-pink">
              Game on.
            </span>
          </h1>
          <p className="mt-7 max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Less “I said it first.” More playing.
            <br />
            One room code. A buzzer for everyone. A clear order when it counts.
          </p>
          <ol className="mt-10 space-y-5 border-t-2 border-zinc-950 pt-6 text-sm dark:border-zinc-300">
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
                  className="mt-0.5 grid size-8 shrink-0 -rotate-6 place-items-center border-2 border-zinc-950 bg-lime-300 font-mono text-xs font-black text-zinc-950 shadow-cyan"
                >
                  {number}
                </span>
                <div>
                  <p className="font-black">{title}</p>
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
