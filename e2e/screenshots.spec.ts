import { test } from "@playwright/test";

const enabled = process.env.SCREENSHOTS === "1";

test("capture product screenshots", async ({ page }) => {
  test.skip(!enabled, "Set SCREENSHOTS=1 to write docs/screenshots.");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.screenshot({ path: "docs/screenshots/01-overview-390.png", fullPage: true });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.screenshot({ path: "docs/screenshots/01-overview-1440.png", fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/purchases/new");
  await page.screenshot({ path: "docs/screenshots/02-add-purchase-390.png", fullPage: true });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/purchases/sample-harbor-coat");
  await page.screenshot({ path: "docs/screenshots/03-sample-purchase-1440.png", fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/limits");
  await page.screenshot({ path: "docs/screenshots/04-limits-390.png", fullPage: true });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/settings");
  await page.screenshot({ path: "docs/screenshots/05-settings-1440.png", fullPage: true });
});
