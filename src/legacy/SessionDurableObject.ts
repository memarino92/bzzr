import { DurableObject } from "cloudflare:workers";

/** Retained for the starter's deployed v1 migration; no new sessions are made. */
export class SessionDurableObject extends DurableObject {
  fetch() {
    return new Response("Legacy sessions are no longer used.", { status: 410 });
  }
}
