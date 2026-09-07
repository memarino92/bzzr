import { env } from "cloudflare:workers";
import { defineApp } from "rwsdk/worker";
import { render, route } from "rwsdk/router";
import { Document } from "./app/Document";
import { Home } from "./app/pages/Home";
import { setCommonHeaders } from "./app/headers";
import { handleApi } from "./server/api";

export { SessionDurableObject } from "./legacy/SessionDurableObject";
export { BuzzerRoom } from "./server/BuzzerRoom";

export default defineApp([
  setCommonHeaders(),
  ({ request }) => {
    if (new URL(request.url).pathname.startsWith("/api/"))
      return handleApi(request, env);
  },
  route("/health", () => Response.json({ status: "ok" })),
  render(Document, [route("/", Home)]),
]);
