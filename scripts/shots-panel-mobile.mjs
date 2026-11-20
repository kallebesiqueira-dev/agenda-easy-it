/**
 * Screenshots del pannello mobile (stile app) per il README.
 * Sessione effimera della conta demo (studio-anna) via magic link OTP.
 * Output: docs/media/{07-agenda,08-servizi,09-orari,10-notifiche}.png
 * Uso: node scripts/shots-panel-mobile.mjs  (server di produzione su :7779)
 */
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { readFileSync, mkdirSync } from "node:fs";

const BASE = process.env.SHOT_BASE ?? "http://localhost:7779";
const OUT = "docs/media";
mkdirSync(OUT, { recursive: true });

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8").split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const { data: link } = await admin.auth.admin.generateLink({ type: "magiclink", email: process.env.DEMO_EMAIL || "demo@agendaeasy.it" });
const jar = new Map();
const sb = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { cookies: { getAll: () => [...jar.entries()].map(([name, value]) => ({ name, value })), setAll: (l) => l.forEach(({ name, value }) => jar.set(name, value)) } });
await sb.auth.verifyOtp({ type: "magiclink", token_hash: link.properties.hashed_token });
const host = new URL(BASE).hostname;
const cookies = [...jar.entries()].map(([name, value]) => ({ name, value, domain: host, path: "/" }));

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 430, height: 920 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
await ctx.addCookies([{ name: "ae-consent", value: "all", domain: host, path: "/" }, ...cookies]);
// Per lo screenshot: mostra la pagina Notifiche push nello stato attivo
// (il permesso è "granted"), così si vede la UI reale a notifiche abilitate.
await ctx.addInitScript(() => {
  function Granted() { return {}; }
  Granted.permission = "granted";
  Granted.requestPermission = async () => "granted";
  // @ts-ignore
  window.Notification = Granted;
});

const page = await ctx.newPage();
async function shot(path, file, waitFor) {
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  if (waitFor) await page.getByText(waitFor).first().waitFor().catch(() => {});
  try { await page.evaluate(() => document.fonts?.ready); } catch {}
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/${file}` });
  console.log("  ✓", file);
}

try {
  await shot("/app", "07-agenda.png", "Novembre");
  await shot("/app/services", "08-servizi.png", "Servizi e prodotti");
  await shot("/app/hours", "09-orari.png", "Orari di apertura");
  await shot("/app/settings/notifiche", "10-notifiche.png", "Resta sempre aggiornata");
  console.log("\n✅ Pannello mobile in docs/media/");
} catch (err) {
  console.error("❌", err?.message ?? err);
  process.exitCode = 1;
} finally {
  await browser.close();
}
