/** Screenshot rápido da página pública (header novo). Uso interno. */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:7778";
const SLUG = process.argv[2] ?? "barber-gold";
mkdirSync("e2e-artifacts/public", { recursive: true });

const browser = await chromium.launch();

for (const [name, viewport] of [
  ["mobile-390", { width: 390, height: 844 }],
  ["desktop-1280", { width: 1280, height: 900 }],
]) {
  const page = await (await browser.newContext({ viewport })).newPage();
  page.setDefaultTimeout(30000);
  await page.goto(`${BASE}/${SLUG}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.screenshot({
    path: `e2e-artifacts/public/header-${name}.png`,
    fullPage: false,
  });
  await page.close();
}

await browser.close();
console.log("ok");
