import { Button } from "./catalyst/button";

export function RoomNotice({
  kind,
  message,
  onRetry,
  roomCode,
}: {
  kind: "loading" | "closed" | "expired" | "error" | "not-found" | "left";
  roomCode?: string;
  message?: string;
  onRetry?: () => void;
}) {
  const title = {
    left: "You left the room.",
    loading: "Finding your room…",
    closed: "That’s a wrap.",
    expired: "This room has finished.",
    error: "Connection interrupted.",
    "not-found": "Nothing buzzing here.",
  }[kind];
  const detail =
    message ??
    {
      left: "Your spot is free for someone else.",
      loading: "Getting your buzzer ready.",
      closed: "The host ended the room. Thanks for playing.",
      expired:
        "The code may be incorrect, or the room has ended. Start fresh with a new room.",
      error: "Check your connection and try again.",
      "not-found": "Check the link, or head home to start a room.",
    }[kind];
  return (
    <div className="mx-auto max-w-lg py-14 text-center">
      <p className="font-mono text-sm font-bold uppercase tracking-widest text-lime-700 dark:text-lime-300">
        bzzr
      </p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">{title}</h1>
      <p
        role={kind === "error" ? "alert" : "status"}
        className="mt-4 text-zinc-500 dark:text-zinc-400"
      >
        {detail}
      </p>
      {kind !== "loading" && (
        <div className="mt-8 flex justify-center gap-3">
          {kind === "left" && roomCode && (
            <Button href={`/room/${roomCode}`} color="lime">
              Join again
            </Button>
          )}
          {onRetry && (
            <Button color="lime" onClick={onRetry}>
              Retry connection
            </Button>
          )}
          <Button href="/" outline>
            Back to home
          </Button>
        </div>
      )}
    </div>
  );
}
