import { useState, useSyncExternalStore } from "react";

const key = "bzzr:left-handed";
const changeEvent = "bzzr:handedness-change";
let cached: boolean | undefined;

function read() {
  if (cached !== undefined) return cached;
  try {
    return (cached = localStorage.getItem(key) === "true");
  } catch {
    return false;
  }
}

function subscribe(notify: () => void) {
  function storageChanged(event: StorageEvent) {
    if (event.key === key || event.key === null) {
      cached = undefined;
      notify();
    }
  }
  window.addEventListener("storage", storageChanged);
  window.addEventListener(changeEvent, notify);
  return () => {
    window.removeEventListener("storage", storageChanged);
    window.removeEventListener(changeEvent, notify);
  };
}

export function useHandedness(remember = true) {
  const saved = useSyncExternalStore(subscribe, read, () => false);
  const [temporary, setTemporary] = useState(false);
  const leftHanded = remember ? saved : temporary;
  function toggle() {
    const next = !leftHanded;
    if (!remember) {
      setTemporary(next);
      return;
    }
    cached = next;
    try {
      localStorage.setItem(key, String(next));
    } catch {
      // Keep the switch usable for this session when storage is unavailable.
    }
    window.dispatchEvent(new Event(changeEvent));
  }
  return [leftHanded, toggle] as const;
}
