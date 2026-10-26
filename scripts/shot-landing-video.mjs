/** Screenshot rápido da seção de vídeo da landing. Uso interno. */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:7778";
mkdirSync("e2e-artifacts/public", { recursive: true });

const browser = await chromium.launch();

for (const [name, viewport] of [
  ["mobile-390", { width: 390, height: 844 }],
  ["desktop-1280", { width: 1280, height: 900 }],
]) {
  const page = await (await browser.newContext({ viewport })).newPage();
  page.setDefaultTimeout(30000);
  await page.goto(`${BASE}/#video`, { waitUntil: "networkidle" });
  await page.locator("#video").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200); // animação data-bubble
  await page.locator("#video").screenshot({
    path: `e2e-artifacts/public/landing-video-${name}.png`,
  });
  await page.close();
}

await browser.close();
console.log("ok");
