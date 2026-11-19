import { expect, test } from "@playwright/test";

test("overview reads sample policies and has no horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "See what you can still ask for." })).toBeVisible();
  await expect(page.getByText("Harbor & Co.").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sample ledger" })).toBeVisible();
  const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(mobileOverflow).toBe(false);

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const desktopOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(desktopOverflow).toBe(false);
});

test("a sample policy page says it is not a real store", async ({ page }) => {
  await page.goto("/policies/harbor-return");
  await expect(page.getByRole("heading", { name: "Harbor & Co." })).toBeVisible();
  await expect(page.getByText("not a real store", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("30 days. The purchase date counts as day 1.")).toBeVisible();
});

test("limits stay off and an unknown page is a real 404", async ({ page }) => {
  await page.goto("/limits");
  await expect(page.getByRole("heading", { name: "Email receipt ingestion" })).toBeVisible();
  await expect(page.getByText("Off").first()).toBeVisible();
  const response = await page.goto("/no-such-record");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "That page is not in Rewind." })).toBeVisible();
});

test("settings persist a name for this browser", async ({ page }) => {
  await page.goto("/settings");
  await page.getByLabel("What should letters call you?").fill("Amina");
  await page.getByLabel("Your timezone").selectOption("America/Los_Angeles");
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(page.getByRole("status")).toContainText("Settings saved");
  await page.reload();
  await expect(page.getByLabel("What should letters call you?")).toHaveValue("Amina");
  await expect(page.getByLabel("Your timezone")).toHaveValue("America/Los_Angeles");
});
