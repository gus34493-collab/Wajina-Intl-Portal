import { test } from "@playwright/test";
import percySnapshot from "@percy/playwright";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

for (const viewport of VIEWPORTS) {
  test.describe(`${viewport.name} (${viewport.width}px)`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test("landing page — hero", async ({ page }) => {
      await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
      await percySnapshot(page, `Landing — Hero [${viewport.name}]`);
    });

    test("portal — login form", async ({ page }) => {
      await page.goto(`${BASE_URL}/portal`, { waitUntil: "networkidle" });
      // Wait for the NeuralGatewayBuffer to clear (auth check resolves)
      await page.waitForSelector("form", { timeout: 10000 });
      await percySnapshot(page, `Portal — Login Form [${viewport.name}]`);
    });

    test("portal — login error state", async ({ page }) => {
      await page.goto(`${BASE_URL}/portal?error=Invalid+credentials`, {
        waitUntil: "networkidle",
      });
      await page.waitForSelector("form", { timeout: 10000 });
      await percySnapshot(page, `Portal — Login Error [${viewport.name}]`);
    });
  });
}
