import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("three browsers play, recover, reset, and end a room", async ({
  browser,
  page: host,
}) => {
  const guestContext = await browser.newContext();
  const secondContext = await browser.newContext();
  const guest = await guestContext.newPage();
  const second = await secondContext.newPage();
  const errors: string[] = [];
  for (const page of [host, guest, second])
    page.on("pageerror", (error) => errors.push(error.message));
  try {
    await host.goto("/");
    await host.getByLabel("Your name").fill("Alex");
    await host.getByRole("button", { name: "Create a room" }).click();
    await expect(host).toHaveURL(/\/room\/[A-Z2-9]{6}$/);
    const url = host.url();
    const code = url.split("/").at(-1)!;
    await expect(
      host.getByText("Open buzzing to start", { exact: true }),
    ).toBeVisible();
    await expect(host.getByRole("button", { name: "Buzz in" })).toBeDisabled();

    // Public invitation link: no credentials are carried by the URL.
    await guest.goto(url);
    await guest.getByLabel("Your name").fill("Sam");
    await guest.getByRole("button", { name: "Join room", exact: true }).click();
    await expect(guest.getByRole("button", { name: "Buzz in" })).toBeVisible();
    // Separate path: join with only a room code.
    await second.goto(new URL("/", url).href);
    await second.getByRole("button", { name: "Join an existing room" }).click();
    await second.getByLabel("Your name").fill("Jules");
    await second.getByLabel("Room code").fill(code.toLowerCase());
    await second
      .getByRole("button", { name: "Join room", exact: true })
      .click();
    await expect(second.getByRole("button", { name: "Buzz in" })).toBeVisible();
    await host.getByRole("button", { name: "Players (3)" }).click();
    await expect(host.getByRole("list", { name: "Players" })).toContainText(
      "Jules",
    );
    await host.getByRole("button", { name: "Close players" }).click();

    await host.getByRole("button", { name: "Open buzzing" }).click();
    await expect(guest.getByRole("button", { name: "Buzz in" })).toBeEnabled();
    await guest.getByRole("button", { name: "Buzz in" }).click();
    await expect(host.getByRole("list", { name: "Buzz order" })).toContainText(
      "Sam",
    );
    await second.getByRole("button", { name: "Buzz in" }).click();
    await host.getByRole("button", { name: "Buzz in" }).click();
    for (const page of [host, guest, second]) {
      const order = page
        .getByRole("list", { name: "Buzz order" })
        .getByRole("listitem");
      await expect(order).toHaveCount(3);
      await expect(order.nth(0)).toContainText("Sam");
      await expect(order.nth(1)).toContainText("Jules");
      await expect(order.nth(2)).toContainText("Alex");
    }
    await guest.reload();
    await expect(guest.getByText("#1", { exact: true })).toBeVisible();
    await expect(guest.getByRole("button", { name: "Buzz in" })).toBeDisabled();
    await expect(
      guest.getByRole("region", { name: "Host controls" }),
    ).toHaveCount(0);

    await host.getByRole("button", { name: "Next round" }).click();
    await expect(guest.getByRole("button", { name: "Buzz in" })).toBeEnabled();
    await host.getByRole("button", { name: "Lock buzzing" }).click();
    await expect(guest.getByRole("button", { name: "Buzz in" })).toBeDisabled();
    await expect(guest.getByText("Buzzing is locked")).toBeVisible();
    await host.getByRole("button", { name: "Next round" }).click();

    await guestContext.setOffline(true);
    await expect(guest.getByRole("button", { name: "Buzz in" })).toBeDisabled();
    await guestContext.setOffline(false);
    await expect(guest.getByRole("button", { name: "Buzz in" })).toBeEnabled();
    await guest.getByRole("button", { name: "Buzz in" }).focus();
    await guest.keyboard.press("Space");
    await expect(host.getByRole("list", { name: "Buzz order" })).toContainText(
      "Sam",
    );

    expect((await new AxeBuilder({ page: host }).analyze()).violations).toEqual(
      [],
    );
    await host.getByRole("button", { name: "Room menu" }).click();
    await host.getByRole("button", { name: "End room", exact: true }).click();
    await host.getByRole("button", { name: "End room for everyone" }).click();
    for (const page of [host, guest, second])
      await expect(
        page.getByRole("heading", { name: "That’s a wrap." }),
      ).toBeVisible();
    expect(errors).toEqual([]);
  } finally {
    await guestContext.close();
    await secondContext.close();
  }
});

test("landing page is accessible and invalid rooms are recoverable", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /First in/ })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "test-results/home.png", fullPage: true });
  await page.goto("/room/not-valid");
  await expect(
    page.getByRole("heading", { name: "Nothing buzzing here." }),
  ).toBeVisible();
  await page.goto("/room/ZZZ234");
  await page.getByLabel("Your name").fill("Sam");
  await page.getByRole("button", { name: "Join room", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "This room has finished." }),
  ).toBeVisible();
});
