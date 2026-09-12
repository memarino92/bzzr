import { expect, test } from "@playwright/test";

test("host removes and bans through the player drawer", async ({
  page: host,
  browser,
}) => {
  const context = await browser.newContext();
  try {
    await host.goto("/");
    await host.getByLabel("Your name").fill("Alex");
    await host.getByRole("button", { name: "Create a room" }).click();
    await expect(host).toHaveURL(/\/room\/[A-Z2-9]{6}$/);
    const url = host.url();
    const guest = await context.newPage();
    await guest.goto(url);
    await guest.getByLabel("Your name").fill("Sam");
    await guest.getByRole("button", { name: "Join room", exact: true }).click();
    await guest.getByRole("button", { name: "Players (2)" }).click();
    await expect(guest.getByRole("button", { name: /Remove/ })).toHaveCount(0);
    await guest.getByRole("button", { name: "Close players" }).click();
    const display = await context.newPage();
    await display.goto(url + "/spectate");
    await expect(
      display.getByRole("heading", { name: /Spectating/ }),
    ).toBeVisible();
    await host.getByRole("button", { name: "Players (2)" }).click();
    await host.getByRole("button", { name: "Remove Sam" }).click();
    await host.getByRole("button", { name: "Remove", exact: true }).click();
    for (const tab of [guest, display])
      await expect(
        tab.getByRole("heading", { name: "You were removed from the room." }),
      ).toBeVisible();
    await guest.getByRole("link", { name: "Join again" }).click();
    await guest.getByLabel("Your name").fill("Sam");
    await guest.getByRole("button", { name: "Join room", exact: true }).click();
    await host.getByRole("button", { name: "Players (2)" }).click();
    await host.getByRole("button", { name: "Remove Sam" }).click();
    await host.getByRole("button", { name: "Ban", exact: true }).click();
    await expect(host.getByText(/There is no way to undo this/)).toBeVisible();
    await host.getByRole("button", { name: "Cancel" }).click();
    await expect(guest.getByRole("button", { name: "Buzz in" })).toBeVisible();
    await host.getByRole("button", { name: "Remove Sam" }).click();
    await host.getByRole("button", { name: "Ban", exact: true }).click();
    await host.getByRole("button", { name: "Ban player" }).click();
    await expect(
      guest.getByRole("heading", { name: "You were banned from the room." }),
    ).toBeVisible();
    await guest.reload();
    await expect(
      guest.getByRole("heading", { name: "You were banned from the room." }),
    ).toBeVisible();
    await expect(guest.getByRole("link", { name: "Join again" })).toHaveCount(
      0,
    );
    await display.reload();
    await expect(
      display.getByRole("heading", { name: "You were banned from the room." }),
    ).toBeVisible();
  } finally {
    await context.close();
  }
});
