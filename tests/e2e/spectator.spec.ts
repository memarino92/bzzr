import { expect, test } from "@playwright/test";

test("host and player each open a spectator tab while continuing to play", async ({
  page: host,
  browser,
}) => {
  const guestContext = await browser.newContext();
  try {
    // Give this additional room-creation journey its own local edge-IP bucket.
    // Cloudflare supplies this header in production; only the test browser sets it.
    await host.setExtraHTTPHeaders({ "CF-Connecting-IP": "192.0.2.10" });
    await host.goto("/");
    await host.getByLabel("Your name").fill("Alex");
    await host.getByRole("button", { name: "Create a room" }).click();
    await expect(host).toHaveURL(/\/room\/[A-Z2-9]{6}$/);
    const guest = await guestContext.newPage();
    await guest.goto(host.url());
    await guest.getByLabel("Your name").fill("Sam");
    await guest.getByRole("button", { name: "Join room", exact: true }).click();
    const views = [];
    for (const player of [host, guest]) {
      await player.getByRole("button", { name: "Room menu" }).click();
      const opened = player.context().waitForEvent("page");
      await player
        .getByRole("link", { name: "Open spectator view (new tab)" })
        .click();
      const view = await opened;
      await expect(view).toHaveURL(player.url() + "/spectate");
      await expect(
        view.getByText("Waiting for the host", { exact: true }),
      ).toBeVisible();
      await expect(view.getByRole("button", { name: "Buzz in" })).toHaveCount(
        0,
      );
      await expect(
        view.getByRole("region", { name: "Host controls" }),
      ).toHaveCount(0);
      await player.getByRole("button", { name: "Room menu" }).press("Escape");
      views.push(view);
    }
    await host
      .getByRole("button", { name: "Open buzzing", exact: true })
      .click();
    await guest.getByRole("button", { name: "Buzz in" }).click();
    await host.getByRole("button", { name: "Buzz in" }).click();
    for (const view of views) {
      await expect(
        view.getByRole("list", { name: "Buzz order" }).getByRole("listitem"),
      ).toHaveCount(2);
      await view.reload();
      await expect(
        view.getByRole("list", { name: "Buzz order" }),
      ).toContainText("Sam");
      await expect(view.getByRole("button", { name: "Buzz in" })).toHaveCount(
        0,
      );
      await view.close();
    }
    await host.reload();
    await expect(
      host.getByRole("button", { name: "Next round" }),
    ).toBeVisible();
    await host.getByRole("button", { name: "Next round" }).click();
    await expect(guest.getByRole("button", { name: "Buzz in" })).toBeEnabled();
  } finally {
    await guestContext.close();
  }
});

test("nameless spectator sees live order and QR invitation survives modal dismissal", async ({
  page: host,
  browser,
}) => {
  const context = await browser.newContext();
  const spectator = await context.newPage();
  try {
    await host.goto("/");
    await host.getByLabel("Your name").fill("Alex");
    await host.getByRole("button", { name: "Create a room" }).click();
    await expect(host).toHaveURL(/\/room\/[A-Z2-9]{6}$/);
    const url = host.url();
    await host.getByRole("button", { name: "Room menu" }).click();
    await host.getByRole("button", { name: "Open QR code" }).click();
    const dialog = host.getByRole("dialog", { name: "Scan to join the room" });
    await expect(dialog.getByText(url)).toBeVisible();
    await expect(
      dialog.getByRole("img", { name: "Room invitation QR code" }),
    ).toBeVisible();
    await dialog.getByRole("button", { name: "Close QR code" }).click();
    await expect(dialog).not.toBeVisible();
    await spectator.goto(url);
    await spectator
      .getByRole("button", { name: "Join as a spectator" })
      .click();
    await expect(
      spectator.getByText("Waiting for the host", { exact: true }),
    ).toBeVisible();
    await expect(
      spectator.getByRole("button", { name: "Buzz in" }),
    ).toHaveCount(0);
    await host
      .getByRole("button", { name: "Open buzzing", exact: true })
      .click();
    await expect(
      spectator.getByText("Buzzing is open", { exact: true }),
    ).toBeVisible();
    await host.getByRole("button", { name: "Buzz in" }).click();
    await expect(
      spectator.getByRole("list", { name: "Buzz order" }),
    ).toContainText("Alex");
    await spectator.reload();
    await expect(
      spectator.getByRole("list", { name: "Buzz order" }),
    ).toContainText("Alex");
    await host
      .getByRole("button", { name: "Lock buzzing", exact: true })
      .click();
    await expect(
      spectator.getByText("Buzzing is closed", { exact: true }),
    ).toBeVisible();
  } finally {
    await context.close();
  }
});
