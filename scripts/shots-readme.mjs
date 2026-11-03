/**
 * Gera os screenshots do README (UI nova) contra o dev/preview server.
 *
 * Saída: docs/media/{01-landing-it,02-landing-en,03-prenotazione,04-orari,
 *                     05-login,06-onboarding}.png
 *
 * - Landing it/en, login: sem auth nem dados.
 * - Prenotazione/Orari: página pública read-only do negócio BARBER-GOLD
 *   (publicado, comped, com serviços/profissionais/horários).
 * - Onboarding: cria UM usuário confirmado (admin API), loga, screenshota o
 *   form e APAGA o usuário no final (nenhum negócio é criado).
 *
 * reducedMotion:'reduce' → GSAP/Lenis off e animações CSS em estado final:
 * screenshots determinísticos (sem texto invisível a meio da animação).
 *
 * Uso: node scripts/shots-readme.mjs   (requer server em BASE, default :7779)
 */
import { chromium } from "playwright";
import { readFileSync, mkdirSync } from "node:fs";

const BASE = process.env.SHOT_BASE ?? "http://localhost:7779";
const SLUG = process.env.SHOT_SLUG ?? "barber-gold";
const OUT = "docs/media";
mkdirSync(OUT, { recursive: true });

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);
const SUPA = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = env.SUPABASE_SECRET_KEY;

const EMAIL = `readme.shot.${Date.now()}@teste.agendaeasy.dev`;
const PASSWORD = "SenhaForte123!";

async function admin(path, opts = {}) {
  const res = await fetch(`${SUPA}${path}`, {
    ...opts,
    headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, "Content-Type": "application/json", ...(opts.headers ?? {}) },
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { ok: res.ok, status: res.status, json, text };
}

const log = (m) => console.log(`\n== ${m}`);
/** Espera fontes + um respiro para o layout assentar antes do screenshot. */
async function settle(page, ms = 600) {
  try { await page.evaluate(() => document.fonts?.ready); } catch {}
  await page.waitForTimeout(ms);
}

const browser = await chromium.launch();
let userId = null;

try {
  // ---------- Landing + login (desktop). IT primeiro; EN só no fim (cookie). ----------
  const desk = await browser.newContext({ viewport: { width: 1280, height: 820 }, deviceScaleFactor: 2, reducedMotion: "reduce" });

  log("1. Landing IT");
  const l1 = await desk.newPage();
  await l1.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await settle(l1, 900);
  await l1.screenshot({ path: `${OUT}/01-landing-it.png` });

  log("5. Login (IT, antes do cookie en)");
  const lg = await desk.newPage();
  await lg.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await lg.getByRole("button", { name: "Accedi" }).waitFor();
  await settle(lg, 500);
  await lg.screenshot({ path: `${OUT}/05-login.png` });

  log("2. Landing EN (cookie lang=en)");
  await desk.addCookies([{ name: "lang", value: "en", url: BASE }]);
  const l2 = await desk.newPage();
  await l2.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await settle(l2, 900);
  await l2.screenshot({ path: `${OUT}/02-landing-en.png` });

  // ---------- Página pública (mobile) ----------
  const mob = await browser.newContext({ viewport: { width: 430, height: 920 }, deviceScaleFactor: 2, reducedMotion: "reduce", isMobile: true, hasTouch: true });

  log("3. Prenotazione (página pública)");
  const pb = await mob.newPage();
  pb.setDefaultTimeout(25000);
  await pb.goto(`${BASE}/${SLUG}`, { waitUntil: "networkidle" });
  await pb.getByText("Scegli il servizio").waitFor();
  await settle(pb, 700);
  await pb.screenshot({ path: `${OUT}/03-prenotazione.png` });

  log("4. Orari (escolha de horário)");
  await pb.locator("main button").first().click(); // 1º serviço
  // 2+ profissionais → passo "professional": pega "Qualsiasi disponibile" (mais slots)
  const anyAvail = pb.getByText("Qualsiasi disponibile");
  if (await anyAvail.isVisible().catch(() => false)) await anyAvail.click();
  await pb.getByText("Scegli data e orario").waitFor();
  const days = pb.locator("main div.overflow-x-auto button");
  const dayCount = await days.count();
  let gotSlots = false;
  for (let i = 1; i < Math.min(dayCount, 10) && !gotSlots; i++) {
    await days.nth(i).click();
    await pb.waitForTimeout(1200); // availability fetch
    if ((await pb.locator("main div.grid button").count()) > 0) gotSlots = true;
  }
  if (!gotSlots) console.warn("   ⚠ nenhum dia com horários — screenshot mostra o seletor de dias");
  await settle(pb, 500);
  await pb.screenshot({ path: `${OUT}/04-orari.png` });

  // ---------- Onboarding (precisa de usuário logado, sem negócio) ----------
  log("6. Onboarding — criando usuário confirmado (admin API)");
  const u = await admin("/auth/v1/admin/users", {
    method: "POST",
    body: JSON.stringify({ email: EMAIL, password: PASSWORD, email_confirm: true }),
  });
  if (!u.ok) throw new Error(`admin user: ${u.status} ${u.text}`);
  userId = u.json.id;
  console.log("   user:", userId);

  const own = await browser.newContext({ viewport: { width: 1280, height: 820 }, deviceScaleFactor: 2, reducedMotion: "reduce" });
  const op = await own.newPage();
  op.setDefaultTimeout(30000);
  await op.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await op.getByPlaceholder("tu@esempio.com").fill(EMAIL);
  await op.getByPlaceholder("Minimo 8 caratteri").fill(PASSWORD);
  await op.getByRole("button", { name: "Accedi" }).click();
  await op.waitForURL(/\/app/, { timeout: 30000 });
  if (!op.url().includes("onboarding")) await op.goto(`${BASE}/app/onboarding`, { waitUntil: "networkidle" });
  // preenche um exemplo bonito (sem enviar) para o form não ficar vazio
  await op.getByPlaceholder("Barberia da Pino").fill("Studio Anna");
  await settle(op, 500);
  await op.screenshot({ path: `${OUT}/06-onboarding.png` });

  console.log("\n✅ Screenshots gerados em docs/media/");
} catch (err) {
  console.error("\n❌ Falhou:", err?.message ?? err);
  process.exitCode = 1;
} finally {
  if (userId) {
    const d = await admin(`/auth/v1/admin/users/${userId}`, { method: "DELETE" });
    console.log(`\n🧹 usuário de teste apagado: ${d.ok ? "ok" : d.status + " " + d.text}`);
  }
  await browser.close();
}
