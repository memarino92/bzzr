import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "../../src/app/components/AppShell";
import { Lobby } from "../../src/app/components/Lobby";
import { RoomNotice } from "../../src/app/components/RoomNotice";

afterEach(() => vi.unstubAllGlobals());
describe("entry and recovery pages", () => {
  it("offers a skip link and home navigation", () => {
    render(
      <AppShell>
        <p>Content</p>
      </AppShell>,
    );
    expect(
      screen.getByRole("link", { name: "Skip to content" }),
    ).toHaveAttribute("href", "#main");
    expect(screen.getByRole("main")).toHaveTextContent("Content");
  });
  it.each(["loading", "closed", "expired", "error", "not-found"] as const)(
    "renders %s notices with appropriate recovery",
    (kind) => {
      const retry = vi.fn();
      render(<RoomNotice kind={kind} onRetry={retry} />);
      expect(screen.getByRole("heading")).toBeInTheDocument();
      if (kind === "loading")
        expect(
          screen.queryByRole("link", { name: "Back to home" }),
        ).not.toBeInTheDocument();
      else
        expect(
          screen.getByRole("link", { name: "Back to home" }),
        ).toHaveAttribute("href", "/");
    },
  );
  it("shows request failure and allows switching between host and code entry", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Offline")));
    render(<Lobby />);
    await userEvent.type(screen.getByLabelText("Your name"), "Alex");
    await userEvent.click(
      screen.getByRole("button", { name: "Create a room" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent("Offline");
    await userEvent.click(
      screen.getByRole("button", { name: "Join an existing room" }),
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Your name"), "Sam");
    await userEvent.type(screen.getByLabelText("Room code"), "ABC234");
    await userEvent.click(screen.getByRole("button", { name: "Join room" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Offline");
  });
});
