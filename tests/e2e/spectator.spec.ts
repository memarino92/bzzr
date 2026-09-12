import { expect, test } from "@playwright/test";

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
