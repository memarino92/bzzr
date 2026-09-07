"use client";

import { useState, type FormEvent } from "react";
import { Button } from "./catalyst/button";
import { Field, Label, Description } from "./catalyst/fieldset";
import { Input } from "./catalyst/input";
import { normalizeCode, validateName } from "../../domain/protocol";

export interface EntryFormProps {
  mode: "host" | "join";
  roomCode?: string;
  busy?: boolean;
  error?: string;
  onSubmit: (name: string, code?: string) => Promise<void> | void;
}

export function EntryForm({
  mode,
  roomCode,
  busy = false,
  error,
  onSubmit,
}: EntryFormProps) {
  const [validation, setValidation] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      const name = validateName(data.get("name"));
      const code =
        mode === "join"
          ? normalizeCode(roomCode ?? String(data.get("code") ?? ""))
          : undefined;
      setValidation("");
      await onSubmit(name, code);
    } catch (error) {
      setValidation(
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  }
  return (
    <form onSubmit={submit} className="space-y-6" aria-busy={busy}>
      <Field disabled={busy}>
        <Label>Your name</Label>
        <Input
          name="name"
          required
          maxLength={48}
          autoComplete="nickname"
          placeholder="e.g. Alex"
        />
        <Description>
          Up to 24 characters. Pick a name the room will recognize.
        </Description>
      </Field>
      {mode === "join" && !roomCode && (
        <Field disabled={busy}>
          <Label>Room code</Label>
          <Input
            name="code"
            required
            minLength={6}
            maxLength={6}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            placeholder="ABC234"
            className="font-mono uppercase tracking-widest"
          />
          <Description>Ask your host for the six-character code.</Description>
        </Field>
      )}
      {(validation || error) && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-400">
          {validation || error}
        </p>
      )}
      <Button type="submit" color="lime" disabled={busy} className="w-full">
        {busy ? "One moment…" : mode === "host" ? "Create a room" : "Join room"}
      </Button>
    </form>
  );
}
