import { expect, test } from "@playwright/test";
import { addCalendarDays, calendarDateInZone } from "../src/lib/time";

test("eligible and outside purchases show different explanations", async ({ page }) => {
  const today = calendarDateInZone(new Date(), "America/New_York");
  const recent = addCalendarDays(today, -2);
  const old = addCalendarDays(today, -40);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/purchases/new");
  await page.getByLabel("Store").fill("Harbor & Co.");
  await page.getByLabel("Purchase date").fill(recent);
  await page.getByLabel("Item 1").fill("Recent coat");
  await page.getByLabel("Price").first().fill("48.00");
  await page.getByRole("button", { name: "Save purchase" }).click();
  await expect(page.getByText("Open under the stored policy").first()).toBeVisible();
  await expect(page.getByText("not a promise the store will pay you").first()).toBeVisible();

  await page.goto("/purchases/new");
  await page.getByLabel("Store").fill("Northline Goods");
  await page.getByLabel("Purchase date").fill(recent);
  await page.getByLabel("Item 1").fill("Tiny sticker");
  await page.getByLabel("Price").first().fill("3.00");
  await page.getByRole("button", { name: "Save purchase" }).click();
  await expect(page.getByText("Outside the stored conditions")).toBeVisible();
  await expect(page.getByText("Open under the stored policy")).toHaveCount(0);
  await expect(page.getByText("does not treat it as eligible")).toBeVisible();

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/purchases/new");
  await page.getByLabel("Store").fill("Harbor & Co.");
  await page.getByLabel("Purchase date").fill(old);
  await page.getByLabel("Item 1").fill("Old hat");
  await page.getByLabel("Price").first().fill("22.00");
  await page.getByRole("button", { name: "Save purchase" }).click();
  await expect(page.getByText("Window closed").first()).toBeVisible();
  await expect(page.getByText("will not call it eligible").first()).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(overflow).toBe(false);
});
