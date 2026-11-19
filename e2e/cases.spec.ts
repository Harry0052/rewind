import { expect, test } from "@playwright/test";
import { addCalendarDays, calendarDateInZone } from "../src/lib/time";

test("a case is not sent until the user records it, then only the confirmed amount counts", async ({ page, browser }) => {
  const recent = addCalendarDays(calendarDateInZone(new Date(), "America/New_York"), -2);
  await page.goto("/purchases/new");
  await page.getByLabel("Store").fill("Harbor & Co.");
  await page.getByLabel("Purchase date").fill(recent);
  await page.getByLabel("Item 1").fill("Case coat");
  await page.getByLabel("Price").first().fill("48.00");
  await page.getByRole("button", { name: "Save purchase" }).click();
  await page.getByRole("link", { name: "Open Return" }).click();
  await page.getByRole("button", { name: "Prepare request" }).click();
  await expect(page.getByText("Rewind has not contacted anyone.")).toBeVisible();
  await expect(page.getByText("Not sent", { exact: true })).toBeVisible();
  const body = page.getByRole("textbox", { name: "Letter" });
  const original = await body.inputValue();
  await body.fill(`${original}\n\nPlease use order AB-12.`);
  await page.getByRole("button", { name: "Save letter" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Changes saved" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("textbox", { name: "Letter" })).toHaveValue(/order AB-12/);

  await page.getByRole("button", { name: "Record that I sent it" }).click();
  await expect(page.getByText("Check the box so Rewind only records what you confirm.")).toBeVisible();
  await page.getByRole("checkbox", { name: "I sent this outside Rewind." }).check();
  await page.getByRole("button", { name: "Record that I sent it" }).click();
  await expect(page.getByText("Rewind did not send the letter.")).toBeVisible();
  await expect(page.getByText("Not sent", { exact: true })).toHaveCount(0);

  await page.getByLabel("Amount received").fill("10.00");
  await page.getByRole("checkbox", { name: "This is the amount I received, not an estimate." }).check();
  await page.getByRole("button", { name: "Record the refund" }).click();
  await expect(page.getByText("You confirmed $10.00 received.")).toBeVisible();

  await page.goto("/");
  await expect(page.getByText("Recorded as received").locator("xpath=..")).toContainText("$10.00");

  const secret = page.url();
  void secret;
  const caseUrl = "/cases";
  const other = await browser.newContext();
  const otherPage = await other.newPage();
  await otherPage.goto(caseUrl);
  await expect(otherPage.getByText("Harbor & Co.")).toHaveCount(0);
  await expect(otherPage.getByText("No cases in this browser.")).toBeVisible();
  await other.close();
});
