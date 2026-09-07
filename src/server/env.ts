import type { BuzzerRoom } from "./BuzzerRoom";

export interface RoomBindings {
  ROOMS: DurableObjectNamespace<BuzzerRoom>;
  CREATE_LIMITER: RateLimit;
  JOIN_LIMITER: RateLimit;
}
