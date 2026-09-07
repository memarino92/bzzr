import type { RoomSnapshot } from "../../domain/protocol";

export const sampleRoom: RoomSnapshot = {
  code: "ABC234",
  round: 1,
  status: "open",
  expiresAt: 1788818400000,
  players: [
    { id: "alex", name: "Alex", isHost: true, online: true },
    { id: "sam", name: "Sam", isHost: false, online: true },
    { id: "jules", name: "Jules", isHost: false, online: true },
    { id: "riley", name: "Riley", isHost: false, online: false },
  ],
  buzzes: [],
};
export const resultsRoom: RoomSnapshot = {
  ...sampleRoom,
  buzzes: [
    { playerId: "sam", position: 1 },
    { playerId: "jules", position: 2 },
    { playerId: "alex", position: 3 },
  ],
};
