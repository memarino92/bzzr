import { useSyncExternalStore } from "react";
import { THEME_STORAGE_KEY } from "../lib/theme";

const changeEvent = "bzzr:theme-change";
const mediaQuery = "(prefers-color-scheme: dark)";

function readDark() {
  const choice = document.documentElement.dataset.theme;
  return (
    choice === "dark" ||
    (choice !== "light" && window.matchMedia(mediaQuery).matches)
  );
}

function subscribe(notify: () => void) {
  const media = window.matchMedia(mediaQuery);
  function storageChanged(event: StorageEvent) {
    if (event.key !== THEME_STORAGE_KEY && event.key !== null) return;
    if (event.newValue === "light" || event.newValue === "dark") {
      document.documentElement.dataset.theme = event.newValue;
    } else {
      delete document.documentElement.dataset.theme;
    }
    notify();
  }
  media.addEventListener("change", notify);
  window.addEventListener("storage", storageChanged);
  window.addEventListener(changeEvent, notify);
  return () => {
    media.removeEventListener("change", notify);
    window.removeEventListener("storage", storageChanged);
    window.removeEventListener(changeEvent, notify);
  };
}

export function useTheme() {
  const dark = useSyncExternalStore(subscribe, readDark, () => false);
  function toggle() {
    const choice = readDark() ? "light" : "dark";
    document.documentElement.dataset.theme = choice;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, choice);
    } catch {
      // An unavailable storage API must not prevent changing the current page.
    }
    window.dispatchEvent(new Event(changeEvent));
  }
  return [dark, toggle] as const;
}
