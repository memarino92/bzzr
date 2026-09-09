"use client";

import { useState } from "react";
import { PlayView } from "../components/PlayView";
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

export function PlayPrototype({ playerCount = 3 }: { playerCount?: 3 | 24 }) {
  const [room, setRoom] = useState(
    playerCount === 24 ? largeDemoRoom : demoRoom,
  );
  return (
    <>
      <aside
        aria-label="Prototype controls"
        className="mx-auto flex min-h-12 max-w-3xl items-center justify-between gap-3 bg-zinc-950 px-4 py-2 text-xs text-white"
      >
        <span>Prototype · simulated round</span>
        <button
          type="button"
          className="min-h-8 px-2 font-bold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-lime-300"
          onClick={() =>
            setRoom({ ...room, round: room.round + 1, buzzes: [] })
          }
        >
          New round
        </button>
      </aside>
      <PlayView
        room={room}
        you="sam"
        connection="connected"
        onBuzz={() =>
          setRoom((current) =>
            current.buzzes.some((buzz) => buzz.playerId === "sam")
              ? current
              : {
                  ...current,
                  buzzes: [
                    ...current.buzzes,
                    { playerId: "sam", position: current.buzzes.length + 1 },
                  ],
                },
          )
        }
      />
    </>
  );
}
