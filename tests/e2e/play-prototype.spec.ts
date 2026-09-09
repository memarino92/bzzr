import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("play prototype swaps sides, discloses participants, and plays another round", async ({
  page,
}) => {
  await page.goto("/prototype/play");
  const buzzer = page.getByRole("button", { name: "Buzz in" });
  const results = page.getByRole("region", { name: "Results" });
  const participants = page.getByRole("list", { name: "Participants" });
  const toggle = page.getByRole("switch", { name: "Left-handed mode" });
  await expect(participants).not.toBeVisible();
  await expect(toggle).not.toBeChecked();
  expect((await buzzer.boundingBox())!.x).toBeGreaterThan(
    (await results.boundingBox())!.x,
  );
  await toggle.focus();
  await page.keyboard.press("Space");
  await expect(toggle).toBeChecked();
  expect((await buzzer.boundingBox())!.x).toBeLessThan(
    (await results.boundingBox())!.x,
  );
  await page.getByText("Participants (3)").click();
  await expect(participants).toBeVisible();
  await expect(participants.getByRole("listitem")).toHaveCount(3);
  await page.getByText("Participants (3)").click();
  await expect(participants).not.toBeVisible();
  await buzzer.click();
  await expect(buzzer).toBeDisabled();
  await expect(page.getByRole("status")).toHaveText("You’re #2");
  await expect(results.getByRole("listitem")).toHaveCount(2);
  await page.getByRole("button", { name: "New round" }).click();
  await expect(buzzer).toBeEnabled();
  await expect(toggle).toBeChecked();
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
