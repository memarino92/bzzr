"use client";

import { useState } from "react";
import {
  Alert,
  AlertTitle,
  AlertDescription,
  AlertActions,
} from "./catalyst/alert";
import { Button } from "./catalyst/button";

export function LeaveRoomAction({
  onLeave,
  description,
  busy = false,
}: {
  onLeave: () => void;
  description: string;
  busy?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        disabled={busy}
        onClick={() => setOpen(true)}
        className="min-h-12 w-full px-2 text-left text-sm font-bold text-red-700 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-50 dark:text-red-400"
      >
        {busy ? "Leaving…" : "Leave room"}
      </button>
      <LeaveRoomDialog
        open={open}
        onClose={setOpen}
        onLeave={onLeave}
        description={description}
        busy={busy}
      />
    </>
  );
}

export function LeaveRoomDialog({
  open,
  onClose,
  onLeave,
  description,
  busy = false,
}: {
  open: boolean;
  onClose: (open: boolean) => void;
  onLeave: () => void;
  description: string;
  busy?: boolean;
}) {
  return (
    <Alert open={open} onClose={onClose}>
      <AlertTitle>Leave this room?</AlertTitle>
      <AlertDescription>
        {description} This leaves the room in all your tabs.
      </AlertDescription>
      <AlertActions>
        <Button plain onClick={() => onClose(false)}>
          Stay in room
        </Button>
        <Button
          color="red"
          disabled={busy}
          onClick={() => {
            onClose(false);
            onLeave();
          }}
        >
          Leave room now
        </Button>
      </AlertActions>
    </Alert>
  );
}
