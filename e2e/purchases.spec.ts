import { expect, test } from "@playwright/test";

test("a purchase persists with a cent-accurate total", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/purchases/new");
  await page.getByLabel("Store").fill("Harbor & Co.");
  await page.getByLabel("Purchase date").fill("2026-11-01");
  await page.getByLabel("Item 1").fill("Wool coat");
  await page.getByLabel("Price").first().fill("86.00");
  await page.getByLabel("Item 2").fill("Scarf");
  await page.locator("#item_1_quantity").fill("2");
  await page.locator("#item_1_price").fill("12.50");
  await page.getByLabel("Receipt note").fill("Blue receipt");
  await page.getByRole("button", { name: "Save purchase" }).click();
  await expect(page.getByRole("status")).toContainText("Purchase saved");
  await expect(page.getByText("$111.00").first()).toBeVisible();
  await expect(page.getByText("Blue receipt")).toBeVisible();
  const url = page.url();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Harbor & Co." })).toBeVisible();
  await expect(page.getByText("$111.00").first()).toBeVisible();

  await page.getByRole("link", { name: "Edit purchase" }).click();
  await page.locator("#item_1_price").fill("10.00");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("$106.00").first()).toBeVisible();

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/purchases");
  await expect(page.getByRole("heading", { name: "Harbor & Co." }).first()).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(overflow).toBe(false);
  expect(url).toContain("/purchases/");
});

test("an invalid price does not create a purchase", async ({ page }) => {
  await page.goto("/purchases/new");
  await page.getByLabel("Store").fill("Nope Goods");
  await page.getByLabel("Purchase date").fill("2026-11-02");
  await page.getByLabel("Item 1").fill("Mug");
  await page.getByLabel("Price").first().fill("5.999");
  await page.getByRole("button", { name: "Save purchase" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "price" })).toBeVisible();
  await page.goto("/purchases");
  await expect(page.getByText("Nope Goods")).toHaveCount(0);
});

test("another browser cannot open the purchase", async ({ browser }) => {
  const owner = await browser.newContext();
  const other = await browser.newContext();
  const ownerPage = await owner.newPage();
  await ownerPage.goto("/purchases/new");
  await ownerPage.getByLabel("Store").fill("Private Market");
  await ownerPage.getByLabel("Purchase date").fill("2026-10-02");
  await ownerPage.getByLabel("Item 1").fill("Lamp");
  await ownerPage.getByLabel("Price").first().fill("40.00");
  await ownerPage.getByRole("button", { name: "Save purchase" }).click();
  await expect(ownerPage.getByRole("heading", { name: "Private Market" })).toBeVisible();
  const secret = ownerPage.url();

  const otherPage = await other.newPage();
  const response = await otherPage.goto(secret);
  expect(response?.status()).toBe(404);
  await expect(otherPage.getByRole("heading", { name: "That page is not in Rewind." })).toBeVisible();
  await expect(otherPage.getByText("Lamp")).toHaveCount(0);
  const id = new URL(secret).pathname.split("/").pop();
  const api = await otherPage.request.get(`/api/purchases/${id}`);
  expect(api.status()).toBe(404);
  await otherPage.goto("/purchases");
  await expect(otherPage.getByText("Private Market")).toHaveCount(0);
  await owner.close();
  await other.close();
});

test("a sample purchase is visible and not editable", async ({ page }) => {
  await page.goto("/purchases/sample-northline-sticker");
  await expect(page.getByText("Sample — not your purchase")).toBeVisible();
  await expect(page.getByText("$3.00").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Edit purchase" })).toHaveCount(0);
});
