import fs from "node:fs";
import { expect, test } from "@playwright/test";

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

test("a receipt file stays private and a bad file is rejected", async ({ page, browser }) => {
  await page.goto("/purchases/new");
  await page.getByLabel("Store").fill("Harbor & Co.");
  await page.getByLabel("Purchase date").fill("2026-11-01");
  await page.getByLabel("Item 1").fill("Private coat");
  await page.getByLabel("Price").first().fill("15.00");
  await page.getByRole("button", { name: "Save purchase" }).click();
  await page.getByLabel("PDF, PNG, JPEG, or WEBP, up to 5 MB").setInputFiles({
    name: "note.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("not a receipt"),
  });
  await page.getByRole("button", { name: "Attach file" }).click();
  await expect(page.getByText("Nothing was stored.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Harbor & Co." })).toBeVisible();

  await page.getByLabel("PDF, PNG, JPEG, or WEBP, up to 5 MB").setInputFiles({
    name: "receipt.png",
    mimeType: "image/png",
    buffer: png,
  });
  await page.getByRole("button", { name: "Attach file" }).click();
  await expect(page.getByText("Not scanned", { exact: true })).toBeVisible();
  const download = page.getByRole("link", { name: "receipt.png" });
  const href = await download.getAttribute("href");
  expect(href).toBeTruthy();

  const other = await browser.newContext();
  const response = await other.request.get(href ?? "/api/receipts/missing");
  expect(response.status()).toBe(404);
  await other.close();
});

test("download includes the purchase and delete removes it", async ({ page }) => {
  await page.goto("/settings");
  await page.getByLabel("What should letters call you?").fill("Nia");
  await page.getByRole("button", { name: "Save settings" }).click();
  await page.goto("/purchases/new");
  await page.getByLabel("Store").fill("Fieldnote Supply");
  await page.getByLabel("Purchase date").fill("2026-11-03");
  await page.getByLabel("Item 1").fill("Notebook");
  await page.getByLabel("Price").first().fill("9.00");
  await page.getByRole("button", { name: "Save purchase" }).click();
  await page.goto("/settings");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download my data" }).click();
  const download = await downloadPromise;
  const body = fs.readFileSync(await download.path(), "utf8");
  expect(body).toContain("Fieldnote Supply");
  expect(body).toContain("Confirmed savings");
  await page.getByLabel("Delete everything in this browser").fill("DELETE");
  await page.getByRole("button", { name: "Delete my data" }).click();
  await expect(page.getByText("Your Rewind data was deleted")).toBeVisible();
  await page.goto("/purchases");
  await expect(page.getByText("Fieldnote Supply")).toHaveCount(0);
});
