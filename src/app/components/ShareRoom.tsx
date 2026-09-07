"use client";

import { useState } from "react";
import { Button } from "./catalyst/button";

export function ShareRoom({ code }: { code: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "fallback">("idle");
  const [link, setLink] = useState("");
  async function copy() {
    const url = window.location.origin + "/room/" + code;
    try {
      await navigator.clipboard.writeText(url);
      setStatus("copied");
    } catch {
      setLink(url);
      setStatus("fallback");
    }
  }
  return (
    <div>
      <Button outline onClick={copy}>
        {status === "copied" ? "Link copied ✓" : "Copy invite link"}
      </Button>
      <span role="status" className="sr-only">
        {status === "copied" ? "Invite link copied to clipboard." : ""}
      </span>
      {status === "fallback" && (
        <div className="mt-3">
          <label
            htmlFor="invite-link"
            className="block text-xs text-zinc-600 dark:text-zinc-400"
          >
            Copy this invite link
          </label>
          <input
            id="invite-link"
            readOnly
            value={link}
            onFocus={(event) => event.target.select()}
            className="mt-1 w-full rounded border border-zinc-300 bg-transparent p-2 text-sm dark:border-zinc-600"
          />
        </div>
      )}
    </div>
  );
}
