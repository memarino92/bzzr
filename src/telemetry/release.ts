/** Vite replaces this in deploy builds; workerd/unit tests need no build metadata. */
declare const __SENTRY_BUILD_RELEASE__: string;
export const buildRelease =
  typeof __SENTRY_BUILD_RELEASE__ === "string"
    ? __SENTRY_BUILD_RELEASE__
    : undefined;
