import { handleApi } from "../../src/server/api";
import type { RoomBindings } from "../../src/server/env";

export { BuzzerRoom } from "../../src/server/BuzzerRoom";
export { SessionDurableObject } from "../../src/legacy/SessionDurableObject";

// Tests exercise the production adapter without loading RSC transforms.
// This entry point is never included in the production Worker.
export default {
  fetch: (request: Request, env: RoomBindings) => handleApi(request, env),
};
