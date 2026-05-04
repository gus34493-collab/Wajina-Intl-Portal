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
      // "networkidle" hangs in dev (HMR WebSocket) and on pages with infinite animations;
      // "load" fires once all resources are fetched, which is sufficient here.
      await page.goto(`${BASE_URL}/`, { waitUntil: "load" });
      // Wait for the Hero h1 — signals React has hydrated and rendered the above-fold content
      await page.waitForSelector("h1", { state: "visible", timeout: 15000 });
      // Hero stagger: last element (CIRCLE_DELAY 0.35s + 1.2s duration) completes at ~1.6s
      await page.waitForTimeout(2000);
      await percySnapshot(page, `Landing — Hero [${viewport.name}]`);
    });

    test("portal — login form", async ({ page }) => {
      await page.goto(`${BASE_URL}/portal`, { waitUntil: "networkidle" });
      // NeuralGatewayBuffer shows for ~800ms while auth resolves; wait for it to clear
      await page.waitForSelector("form", { state: "visible", timeout: 10000 });
      // Form card entry animation: duration 0.8s — wait for it to finish
      await page.waitForTimeout(1000);
      await percySnapshot(page, `Portal — Login Form [${viewport.name}]`);
    });

    test("portal — login error state", async ({ page }) => {
      await page.goto(`${BASE_URL}/portal?error=Invalid+credentials`, {
        waitUntil: "networkidle",
      });
      // NeuralGatewayBuffer clears after ~800ms, then error banner animates in
      await page.waitForSelector("form", { state: "visible", timeout: 10000 });
      // Form + error banner entry animations both complete within this window
      await page.waitForTimeout(1000);
      await percySnapshot(page, `Portal — Login Error [${viewport.name}]`);
    });
  });
}
