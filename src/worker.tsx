import { env } from "cloudflare:workers";
import { defineApp } from "rwsdk/worker";
import { render, route } from "rwsdk/router";
import { Document } from "./app/Document";
import { Home } from "./app/pages/Home";
import { PlayPrototype } from "./app/pages/PlayPrototype";
import { AppShell } from "./app/components/AppShell";
import { RoomClient } from "./app/components/RoomClient";
import { RoomNotice } from "./app/components/RoomNotice";
import { normalizeCode } from "./domain/protocol";
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
  render(Document, [
    route("/", Home),
    route("/prototype/play", ({ request }) => (
      <PlayPrototype
        playerCount={
          new URL(request.url).searchParams.get("players") === "24" ? 24 : 3
        }
      />
    )),
    route("/room/:code", ({ params, response }) => {
      try {
        return (
          <AppShell>
            <RoomClient code={normalizeCode(params.code)} />
          </AppShell>
        );
      } catch {
        response.status = 404;
        return (
          <AppShell>
            <RoomNotice kind="not-found" />
          </AppShell>
        );
      }
    }),
    route("*", ({ response }) => {
      response.status = 404;
      return (
        <AppShell>
          <RoomNotice kind="not-found" />
        </AppShell>
      );
    }),
  ]),
]);
