import { initClient } from "rwsdk/client";
import { captureException } from "@sentry/react";
import { initBrowserSentry } from "./app/lib/sentry";

const hydrateRootOptions = initBrowserSentry();
void initClient({ hydrateRootOptions }).catch((error: unknown) => {
  // Hydration callbacks cover React; this covers framework bootstrap failures.
  captureException(error);
  console.error("client_bootstrap_failed");
});
