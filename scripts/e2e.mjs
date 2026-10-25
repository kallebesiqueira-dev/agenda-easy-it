/**
 * E2E completo contra o dev server (http://localhost:7778) + Supabase cloud.
 * Fluxo: signup(admin) → login → onboarding → serviço → profissional+turnos →
 * horários → publicação → reserva pública (confirmada na hora, sem acconto) →
 * agenda do painel → página de billing (Stripe, somente leitura).
 *
 * A UI é verificada em italiano (lingua default — cookie `lang` ausente).
 * Billing: produção usa chaves Stripe reais, então o teste NÃO abre o checkout;
 * apenas confirma que a página carrega com o botão de assinatura.
 *
 * Uso: node scripts/e2e.mjs
 */
import { chromium } from "playwright";
import { readFileSync, mkdirSync } from "node:fs";

const BASE = process.env.E2E_BASE ?? "http://localhost:7778";
const ART = "e2e-artifacts";
mkdirSync(ART, { recursive: true });

// --- env ---
const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);
const SUPA = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = env.SUPABASE_SECRET_KEY;

const ts = Date.now();
const EMAIL = `e2e.${ts}@teste.agendaeasy.dev`;
const PASSWORD = "SenhaForte123!";
const BIZ_NAME = `Studio E2E ${ts}`;
const SLUG = `studio-e2e-${ts}`;

let step = "";
function log(msg) {
  step = msg;
  console.log(`\n== ${msg}`);
}

async function supaAdmin(path, opts = {}) {
  const res = await fetch(`${SUPA}${path}`, {
    ...opts,
    headers: {
      apikey: SERVICE,
      Authorization: `Bearer ${SERVICE}`,
      "Content-Type": "application/json",
      ...(opts.headers ?? {}),
    },
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { ok: res.ok, status: res.status, json, text };
}

const browser = await chromium.launch();
const ctxOwner = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctxOwner.newPage();
page.setDefaultTimeout(20000);

try {
  log("1. Criando usuário confirmado (admin API)");
  const user = await supaAdmin("/auth/v1/admin/users", {
    method: "POST",
    body: JSON.stringify({ email: EMAIL, password: PASSWORD, email_confirm: true }),
  });
  if (!user.ok) throw new Error(`admin user: ${user.status} ${user.text}`);
  console.log("   user id:", user.json.id);

  log("2. Login pela UI");
  await page.goto(`${BASE}/login`);
  await page.getByPlaceholder("tu@esempio.com").fill(EMAIL);
  await page.getByPlaceholder("Minimo 8 caratteri").fill(PASSWORD);
  await page.getByRole("button", { name: "Accedi" }).click();
  await page.waitForURL(/\/app/, { timeout: 30000 });
  console.log("   →", page.url());

  log("3. Onboarding: criando negócio");
  if (!page.url().includes("onboarding")) await page.goto(`${BASE}/app/onboarding`);
  await page.getByPlaceholder("Barberia da Pino").fill(BIZ_NAME);
  await page.getByPlaceholder("barberia-da-pino").fill(SLUG);
  await page.getByRole("button", { name: "Crea e vai al pannello" }).click();
  await page.waitForURL(/\/app(?!\/onboarding)/, { timeout: 30000 });
  console.log("   negócio criado →", page.url());

  log("4. Cadastrando serviço");
  await page.goto(`${BASE}/app/services`);
  await page.getByRole("button", { name: "Nuovo servizio" }).click();
  await page.getByPlaceholder("Taglio uomo").fill("Taglio E2E");
  await page.getByPlaceholder("45,00").fill("80,00");
  await page.getByRole("button", { name: "Salva", exact: true }).click();
  await page.getByText(/80,00\s*€\s*·\s*30 min/).waitFor();
  console.log("   serviço ok");

  log("4b. Cadastrando produto (vetrina)");
  await page.getByRole("button", { name: "Prodotti" }).click();
  await page.getByRole("button", { name: "Nuovo prodotto" }).click();
  await page.getByPlaceholder("Pomata modellante").fill("Pomata E2E");
  await page.locator('input[placeholder="45,00"]').fill("15,00");
  await page.getByRole("button", { name: "Salva", exact: true }).click();
  await page.getByText("Pomata E2E").waitFor();
  console.log("   produto ok");

  log("5. Cadastrando profissional (turnos nascem automáticos)");
  await page.goto(`${BASE}/app/professionals`);
  await page.getByRole("button", { name: "Aggiungi" }).first().click();
  await page.locator('input[placeholder^="Nome del"]').fill("Pro E2E");
  await page.getByRole("button", { name: "Salva", exact: true }).click();
  await page.getByText("Pro E2E").waitFor();
  const turnos = await page
    .getByRole("button", { name: /Turni \(\d+\)/ })
    .innerText();
  if (turnos.includes("(0)")) throw new Error("profissional sem turnos automáticos");
  console.log(`   profissional ok — ${turnos}`);

  log("6. Horários de funcionamento: abrindo todos os dias");
  await page.goto(`${BASE}/app/hours`);
  const dayRows = page
    .locator("section", { hasText: "Orari di apertura" })
    .first()
    .locator("li");
  const n = await dayRows.count();
  for (let i = 0; i < n; i++) {
    const cb = dayRows.nth(i).locator('input[type="checkbox"]');
    if (!(await cb.isChecked())) await cb.check();
  }
  await page.getByRole("button", { name: "Salva orari" }).click();
  await page.waitForTimeout(1500);
  console.log("   horários salvos");

  log("6b. Cadastrando piano/promozione");
  await page.goto(`${BASE}/app/plans`);
  await page.getByRole("button", { name: "Nuovo piano" }).click();
  await page.getByPlaceholder("Es.: Abbonamento mensile").fill("Promo E2E");
  await page.getByRole("button", { name: "Salva", exact: true }).click();
  await page.getByText("Promo E2E").waitFor();
  console.log("   piano ok");

  log("6c. Configurações: publicando a página");
  await page.goto(`${BASE}/app/settings`);
  const pubCb = page.locator('input[type="checkbox"]');
  if (!(await pubCb.isChecked())) await pubCb.check();
  await page.getByRole("button", { name: "Salva impostazioni" }).click();
  await page.waitForTimeout(1500);
  console.log("   publicado");

  log("7. Reserva pública (cliente, contexto anônimo)");
  const ctxClient = await browser.newContext({ viewport: { width: 500, height: 900 } });
  const pub = await ctxClient.newPage();
  pub.setDefaultTimeout(20000);
  await pub.goto(`${BASE}/${SLUG}`);
  // vitrine: piano e produto visíveis antes de escolher o serviço
  await pub.getByText("Promo E2E").waitFor();
  await pub.getByText("Pomata E2E").waitFor();
  console.log("   piano e produto visíveis na página pública");
  await pub.getByText("Taglio E2E").click();
  // único profissional → vai direto para data/horário
  await pub.getByText("Scegli data e orario").waitFor();
  // amanhã = 2º chip de dia
  await pub.locator("button:has(span.font-semibold)").nth(1).click();
  const slot = pub.locator("div.grid button").first();
  await slot.waitFor({ timeout: 30000 });
  const slotLabel = await slot.innerText();
  await slot.click();
  await pub.getByPlaceholder("Il tuo nome").fill("Cliente E2E");
  await pub.getByPlaceholder("333 123 4567").fill("3331234567");
  if (process.env.E2E_EMAIL) {
    await pub
      .getByPlaceholder("Per ricevere il promemoria dell'appuntamento")
      .fill(process.env.E2E_EMAIL);
  }
  await pub.getByRole("button", { name: "Prenota l'orario" }).click();
  await pub.getByText("Prenotazione confermata!").waitFor({ timeout: 30000 });
  await pub.screenshot({ path: `${ART}/07-reserva.png` });
  console.log(`   reserva feita (${slotLabel}) — confirmada na hora, sem sinal`);
  await ctxClient.close();

  log("8. Painel: agendamento aparece na agenda de amanhã (já confirmado)");
  await page.goto(`${BASE}/app`);
  await page.getByLabel("Giorno successivo").click();
  await page.getByText("Cliente E2E").waitFor({ timeout: 15000 });
  await page.screenshot({ path: `${ART}/08-agenda.png` });
  console.log("   agendamento visível no painel");

  log("9. Billing: página Stripe carrega (somente leitura — sem checkout)");
  await page.goto(`${BASE}/app/billing`);
  await page.getByRole("button", { name: "Abbonati ora" }).waitFor({ timeout: 15000 });
  await page.screenshot({ path: `${ART}/09-billing.png` });
  console.log("   botão 'Abbonati ora' visível (checkout não aberto: Stripe em produção cobra de verdade)");

  console.log("\n✅ E2E — todos os passos passaram.");
  console.log(`   negócio: ${BASE}/${SLUG} | login: ${EMAIL}`);
} catch (err) {
  console.error(`\n❌ FALHOU no passo: ${step}`);
  console.error(err?.message ?? err);
  try { await page.screenshot({ path: `${ART}/falha.png`, fullPage: true }); } catch {}
  process.exitCode = 1;
} finally {
  await browser.close();
}
