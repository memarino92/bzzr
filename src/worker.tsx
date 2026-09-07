import { defineApp } from "rwsdk/worker";
import { render, route } from "rwsdk/router";
import { Document } from "./app/Document";
import { Home } from "./app/pages/Home";
import { setCommonHeaders } from "./app/headers";

export { SessionDurableObject } from "./legacy/SessionDurableObject";

export default defineApp([
  setCommonHeaders(),
  route("/health", () => Response.json({ status: "ok" })),
  render(Document, [route("/", Home)]),
]);
