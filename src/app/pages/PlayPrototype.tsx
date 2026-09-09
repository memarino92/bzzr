"use client";

import { useState } from "react";
import { PlayView } from "../components/PlayView";
import { RoomNotice } from "../components/RoomNotice";
import type { RoomSnapshot } from "../../domain/protocol";

const demoRoom: RoomSnapshot = {
  code: "DEMO23",
  round: 1,
  status: "open",
  expiresAt: 0,
  players: [
    { id: "alex", name: "Alex", isHost: true, online: true },
    { id: "sam", name: "Sam", isHost: false, online: true },
    { id: "jules", name: "Jules", isHost: false, online: true },
  ],
  buzzes: [{ playerId: "alex", position: 1 }],
};

const longNames: Record<string, string> = {
  Alex: "Alexander the Quizmaster",
  Sam: "Sam the Lightning Legend",
  Jules: "JulesKnowsAllTheAnswers",
  Riley: "Riley the Quick Thinker",
  Morgan: "Morgan McTrivia-Williams",
  Casey: "CaseyTheBuzzerDestroyer",
  Jordan: "Jordan Lightning-Fingers",
};

const largeDemoRoom: RoomSnapshot = {
  ...demoRoom,
  players: [
    "Alex",
    "Sam",
    "Jules",
    "Riley",
    "Morgan",
    "Casey",
    "Jordan",
    "Taylor",
    "Avery",
    "Cameron",
    "Drew",
    "Quinn",
    "Harper",
    "Jamie",
    "Reese",
    "Parker",
    "Rowan",
    "Skyler",
    "Finley",
    "Emerson",
    "Charlie",
    "Dakota",
    "Blake",
    "Sage",
  ].map((name, index) => ({
    id: name.toLowerCase(),
    name: longNames[name] ?? name,
    isHost: index === 0,
    online: true,
  })),
  buzzes: [],
};
largeDemoRoom.buzzes = largeDemoRoom.players
  .filter((player) => player.id !== "sam")
  .map((player, index) => ({ playerId: player.id, position: index + 1 }));

export function PlayPrototype({
  playerCount = 3,
  host = false,
}: {
  playerCount?: 3 | 24;
  host?: boolean;
}) {
  const initialRoom = playerCount === 24 ? largeDemoRoom : demoRoom;
  const [room, setRoom] = useState<RoomSnapshot>(
    host
      ? { ...initialRoom, round: 0, status: "waiting", buzzes: [] }
      : initialRoom,
  );
  const [ended, setEnded] = useState(false);
  const you = host ? "alex" : "sam";
  return (
    <>
      <aside
        aria-label="Prototype controls"
        className="mx-auto flex min-h-12 max-w-3xl items-center justify-between gap-3 bg-zinc-950 px-4 py-2 text-xs text-white"
      >
        <span>Prototype · {host ? "host" : "simulated round"}</span>
        <button
          type="button"
          className="min-h-8 px-2 font-bold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-lime-300 disabled:opacity-40"
          disabled={host && !ended && room.status !== "open"}
          onClick={() => {
            if (ended) {
              setRoom({
                ...initialRoom,
                round: 0,
                status: "waiting",
                buzzes: [],
              });
              setEnded(false);
            } else if (host) {
              setRoom((current) => ({
                ...current,
                buzzes: [
                  ...current.buzzes,
                  ...current.players
                    .filter(
                      (player) =>
                        player.id !== you &&
                        !current.buzzes.some(
                          (buzz) => buzz.playerId === player.id,
                        ),
                    )
                    .map((player, index) => ({
                      playerId: player.id,
                      position: current.buzzes.length + index + 1,
                    })),
                ],
              }));
            } else {
              setRoom({ ...room, round: room.round + 1, buzzes: [] });
            }
          }}
        >
          {ended ? "Restart demo" : host ? "Sample buzzes" : "New round"}
        </button>
      </aside>
      {ended ? (
        <div className="px-4">
          <RoomNotice kind="closed" />
        </div>
      ) : (
        <PlayView
          demo
          room={room}
          you={you}
          connection="connected"
          onHostCommand={
            host
              ? (command) => {
                  if (command.type === "end") {
                    setEnded(true);
                    setRoom({ ...room, players: [], buzzes: [] });
                  }
                  if (command.type === "reset")
                    setRoom({
                      ...room,
                      status: "open",
                      round: room.round + 1,
                      buzzes: [],
                    });
                  if (command.type === "lock")
                    setRoom({ ...room, status: "locked" });
                }
              : undefined
          }
          onBuzz={() =>
            setRoom((current) =>
              current.status !== "open" ||
              current.buzzes.some((buzz) => buzz.playerId === you)
                ? current
                : {
                    ...current,
                    buzzes: [
                      ...current.buzzes,
                      { playerId: you, position: current.buzzes.length + 1 },
                    ],
                  },
            )
          }
        />
      )}
    </>
  );
}
