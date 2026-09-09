import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("host prototype opens, fills, locks, resets, and ends a room", async ({
  page,
}) => {
  await page.goto("/prototype/play?host=1&players=24");
  const buzzer = page.getByRole("button", { name: "Buzz in" });
  await expect(
    page.getByRole("region", { name: "Host controls" }),
  ).toBeVisible();
  await expect(buzzer).toBeDisabled();
  await expect(
    page
      .getByRole("region", { name: "Host controls" })
      .getByRole("button", { name: "End room" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Lock buzzing" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Open buzzing" }).click();
  await expect(buzzer).toBeEnabled();
  await page.getByRole("button", { name: "Sample buzzes" }).click();
  await expect(
    page.getByRole("list", { name: "Buzz order" }).getByRole("listitem"),
  ).toHaveCount(23);
  await buzzer.click();
  await expect(page.getByRole("status")).toHaveText("You’re #24");
  await page.getByRole("button", { name: "Lock buzzing" }).click();
  await expect(
    page.getByRole("button", { name: "Lock buzzing" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Next round" }).click();
  await expect(buzzer).toBeEnabled();
  await expect(page.getByText("Host · Round 2")).toBeVisible();
  await page.getByRole("button", { name: "Room menu" }).click();
  await page.getByRole("button", { name: "End room", exact: true }).click();
  await page.getByRole("button", { name: "Keep playing" }).click();
  await expect(buzzer).toBeEnabled();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Room menu" }).click();
  await page.getByRole("button", { name: "End room", exact: true }).click();
  await page.getByRole("button", { name: "End room for everyone" }).click();
  await expect(
    page.getByRole("heading", { name: "That’s a wrap." }),
  ).toBeVisible();
  await expect(buzzer).not.toBeVisible();
  await page.getByRole("button", { name: "Restart demo" }).click();
  await expect(
    page.getByRole("button", { name: "Open buzzing" }),
  ).toBeVisible();
});

test("two dozen players fit in scrollable results and the participant drawer", async ({
  page,
}) => {
  await page.goto("/prototype/play?players=24");
  const results = page.getByRole("list", { name: "Buzz order" });
  await expect(results.getByRole("listitem")).toHaveCount(23);
  await page.getByRole("button", { name: "Buzz in" }).click();
  await expect(page.getByRole("status")).toHaveText("You’re #24");
  await expect(results.getByRole("listitem")).toHaveCount(24);
  await page.getByRole("region", { name: "Results" }).focus();
  await page.keyboard.press("End");
  await expect(results.getByText("You", { exact: true })).toBeInViewport();
  await page.getByText("Participants (24)").click();
  const drawer = page.getByRole("dialog", { name: "Participants (24)" });
  await expect(drawer).toBeVisible();
  const panel = await page
    .getByRole("heading", { name: "Participants (24)" })
    .boundingBox();
  expect(panel!.y).toBeLessThan(page.viewportSize()!.height / 2);
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).overflow,
    ),
  ).toBe("hidden");
  await expect(
    page.getByRole("list", { name: "Participants" }).getByRole("listitem"),
  ).toHaveCount(24);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole("button", { name: "Close participants" }).click();
  await page.getByRole("button", { name: "New round" }).click();
  await expect(page.getByText("Participants (24)")).toBeVisible();
});

test("room menu copies the code and dismisses with Escape", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/prototype/play");
  await expect(page.getByRole("link", { name: "bzzr home" })).toBeVisible();
  await page.getByRole("button", { name: "Room menu" }).click();
  await expect(
    page.getByRole("button", { name: "End room", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Copy room code" }).click();
  await expect(
    page.getByRole("button", { name: "Room code copied ✓" }),
  ).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "DEMO23",
  );
  await page.getByRole("button", { name: "Copy room link" }).click();
  await expect(
    page.getByRole("button", { name: "Room link copied ✓" }),
  ).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    new URL("/room/DEMO23", page.url()).href,
  );
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Room menu" })).toBeFocused();
});

test("room menu works when clipboard and local storage are blocked", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new Error("Storage blocked");
    };
    Storage.prototype.setItem = () => {
      throw new Error("Storage blocked");
    };
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async () => {
          throw new Error("Clipboard blocked");
        },
      },
    });
  });
  await page.goto("/prototype/play");
  await page.getByRole("button", { name: "Room menu" }).click();
  const toggle = page.getByRole("switch", { name: "Left-handed mode" });
  await toggle.click();
  await expect(toggle).toBeChecked();
  await page.getByRole("button", { name: "Copy room code" }).click();
  await expect(page.getByLabel("Copy this room code")).toHaveValue("DEMO23");
});

test("social metadata and favicon assets are available in the built app", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    "https://bzzr.app/social-card.png",
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary_large_image",
  );
  for (const path of [
    "/favicon.svg",
    "/favicon.ico",
    "/apple-touch-icon.png",
    "/social-card.png",
    "/social-square.png",
  ]) {
    const response = await request.get(path);
    expect(response.ok()).toBe(true);
    expect(response.headers()["content-type"]).toContain("image/");
  }
});

test("play prototype swaps sides, discloses participants, and plays another round", async ({
  page,
}) => {
  await page.goto("/prototype/play");
  const buzzer = page.getByRole("button", { name: "Buzz in" });
  const results = page.getByRole("region", { name: "Results" });
  const participants = page.getByRole("list", { name: "Participants" });
  const toggle = page.getByRole("switch", { name: "Left-handed mode" });
  await expect(participants).not.toBeVisible();
  await page.getByRole("button", { name: "Room menu" }).click();
  await expect(toggle).not.toBeChecked();
  expect((await buzzer.boundingBox())!.x).toBeGreaterThan(
    (await results.boundingBox())!.x,
  );
  await toggle.focus();
  await page.keyboard.press("Space");
  await expect(toggle).toBeChecked();
  await page.keyboard.press("Escape");
  await page.reload();
  await page.getByRole("button", { name: "Room menu" }).click();
  await expect(toggle).toBeChecked();
  await page.keyboard.press("Escape");
  expect((await buzzer.boundingBox())!.x).toBeLessThan(
    (await results.boundingBox())!.x,
  );
  await page.getByText("Participants (3)").click();
  await expect(participants).toBeVisible();
  await expect(participants.getByRole("listitem")).toHaveCount(3);
  await page.getByRole("button", { name: "Close participants" }).click();
  await expect(participants).not.toBeVisible();
  await buzzer.click();
  await expect(buzzer).toBeDisabled();
  await expect(page.getByRole("status")).toHaveText("You’re #2");
  await expect(results.getByRole("listitem")).toHaveCount(2);
  await page.getByRole("button", { name: "New round" }).click();
  await expect(buzzer).toBeEnabled();
  await page.getByRole("button", { name: "Room menu" }).click();
  await expect(toggle).toBeChecked();
  await page.keyboard.press("Escape");
  await expect(
    results.getByText("No buzzes yet.", { exact: false }),
  ).toBeVisible();
  await buzzer.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toHaveText("You’re #1");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
