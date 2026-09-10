import { expect, test } from "@playwright/test";

test("theme follows the system until the first choice, then remembers the override", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await page.getByLabel("Your name").fill("Alex");
  await page.getByRole("button", { name: "Create a room" }).click();
  await expect(page).toHaveURL(/\/room\/[A-Z2-9]{6}$/);
  const control = page.getByRole("switch", { name: "Dark mode", exact: true });
  await expect(control).not.toBeChecked();
  expect(
    await page.evaluate(() => localStorage.getItem("bzzr:theme")),
  ).toBeNull();
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(control).toBeChecked();
  await expect(page.locator("body")).toHaveCSS("color-scheme", "dark");
  expect(
    await page.evaluate(() => localStorage.getItem("bzzr:theme")),
  ).toBeNull();

  await control.click();
  await expect(control).not.toBeChecked();
  expect(await page.evaluate(() => localStorage.getItem("bzzr:theme"))).toBe(
    "light",
  );
  await expect(page.locator("body")).toHaveCSS("color-scheme", "light");
  await page.emulateMedia({ colorScheme: "light" });
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(control).not.toBeChecked();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Open buzzing" }),
  ).toBeEnabled();
  await expect(control).not.toBeChecked();
  await expect(page.locator("body")).toHaveCSS("color-scheme", "light");

  await control.focus();
  await page.keyboard.press("Space");
  await expect(control).toBeChecked();
  await page.emulateMedia({ colorScheme: "light" });
  await expect(control).toBeChecked();
  expect(await page.evaluate(() => localStorage.getItem("bzzr:theme"))).toBe(
    "dark",
  );
  await page.goto("/");
  await expect(page.locator("body")).toHaveCSS("color-scheme", "dark");
});

test("saved theme applies even before the app's client JavaScript loads", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.addInitScript(() => localStorage.setItem("bzzr:theme", "dark"));
  await page.route("**/assets/*.js", (route) => route.abort());
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("body")).toHaveCSS("color-scheme", "dark");
});

test("theme remains switchable when browser storage is unavailable", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new Error("Storage blocked");
    };
    Storage.prototype.setItem = () => {
      throw new Error("Storage blocked");
    };
  });
  await page.goto("/");
  await page.getByLabel("Your name").fill("Alex");
  await page.getByRole("button", { name: "Create a room" }).click();
  await expect(page).toHaveURL(/\/room\/[A-Z2-9]{6}$/);
  const control = page.getByRole("switch", { name: "Dark mode", exact: true });
  await control.click();
  await expect(control).toBeChecked();
  await expect(page.locator("body")).toHaveCSS("color-scheme", "dark");
  await control.click();
  await expect(control).not.toBeChecked();
});
