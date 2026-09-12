import { expect, test } from "@playwright/test";

test("leaving frees the seat across tabs and hands off the host", async ({
  page: host,
  browser,
}) => {
  await host.setExtraHTTPHeaders({ "CF-Connecting-IP": "192.0.2.20" });
  const guestContext = await browser.newContext();
  try {
    await host.goto("/");
    await host.getByLabel("Your name").fill("Alex");
    await host.getByRole("button", { name: "Create a room" }).click();
    await expect(host).toHaveURL(/\/room\/[A-Z2-9]{6}$/);
    const url = host.url();
    const guest = await guestContext.newPage();
    await guest.goto(url);
    await guest.getByLabel("Your name").fill("Sam");
    await guest.getByRole("button", { name: "Join room", exact: true }).click();
    const display = await host.context().newPage();
    await display.goto(url + "/spectate");
    await expect(
      display.getByRole("heading", { name: /Spectating/ }),
    ).toBeVisible();
    await host.getByRole("button", { name: "Room menu" }).click();
    await host.getByRole("button", { name: "Leave room", exact: true }).click();
    await expect(host.getByRole("dialog")).toContainText(
      "Sam will become the host.",
    );
    await host.getByRole("button", { name: "Stay in room" }).click();
    await expect(
      host.getByRole("button", { name: "Open buzzing", exact: true }),
    ).toBeVisible();
    await host.getByRole("button", { name: "Room menu" }).click();
    await host.getByRole("button", { name: "Leave room", exact: true }).click();
    await host.getByRole("button", { name: "Leave room now" }).click();
    await expect(
      host.getByRole("heading", { name: "You left the room." }),
    ).toBeVisible();
    await expect(
      display.getByRole("heading", { name: "You left the room." }),
    ).toBeVisible();
    await expect(
      guest.getByRole("button", { name: "Open buzzing", exact: true }),
    ).toBeVisible();
    await host.getByRole("link", { name: "Join again" }).click();
    await host.getByLabel("Your name").fill("Alex");
    await host.getByRole("button", { name: "Join room", exact: true }).click();
    await expect(host.getByRole("button", { name: "Buzz in" })).toBeVisible();
    await expect(
      host.getByRole("region", { name: "Host controls" }),
    ).toHaveCount(0);
    await display.close();
  } finally {
    await guestContext.close();
  }
});
