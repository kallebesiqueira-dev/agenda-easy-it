/**
 * E2E completo contra o dev server (http://localhost:8888) + Supabase cloud + Asaas sandbox.
 * Fluxo: signup(admin) → login → onboarding → serviço → profissional+turnos →
 * horários → reserva pública → agenda do painel → assinatura Asaas → webhook → ativa.
 *
 * Uso: node scripts/e2e.mjs
 */
import { chromium } from "playwright";
import { readFileSync, mkdirSync } from "node:fs";

const BASE = process.env.E2E_BASE ?? "http://localhost:8888";
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
const WEBHOOK_TOKEN = env.ASAAS_WEBHOOK_TOKEN;

const ts = Date.now();
const EMAIL = `e2e.${ts}@teste.agendaeasy.dev`;
const PASSWORD = "SenhaForte123!";
const BIZ_NAME = `Studio E2E ${ts}`;
const SLUG = `studio-e2e-${ts}`;
const CPF = "52998224725";

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
  await page.getByPlaceholder("voce@exemplo.com").fill(EMAIL);
  await page.getByPlaceholder("Mínimo de 8 caracteres").fill(PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/app/, { timeout: 30000 });
  console.log("   →", page.url());

  log("3. Onboarding: criando negócio");
  if (!page.url().includes("onboarding")) await page.goto(`${BASE}/app/onboarding`);
  await page.getByPlaceholder("Barbearia do Zé").fill(BIZ_NAME);
  await page.getByPlaceholder("barbearia-do-ze").fill(SLUG);
  await page.getByRole("button", { name: "Criar e ir para o painel" }).click();
  await page.waitForURL(/\/app(?!\/onboarding)/, { timeout: 30000 });
  console.log("   negócio criado →", page.url());

  log("4. Cadastrando serviço");
  await page.goto(`${BASE}/app/services`);
  await page.getByRole("button", { name: "Novo serviço" }).click();
  await page.getByPlaceholder("Corte masculino").fill("Corte E2E");
  await page.getByPlaceholder("45,00").fill("80,00");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await page.getByText("R$ 80,00 · 30 min").waitFor();
  console.log("   serviço ok");

  log("5. Cadastrando profissional (turnos nascem automáticos)");
  await page.goto(`${BASE}/app/professionals`);
  await page.getByRole("button", { name: "Adicionar" }).first().click();
  await page.locator('input[placeholder^="Nome do"]').fill("Pro E2E");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await page.getByText("Pro E2E").waitFor();
  const turnos = await page
    .getByRole("button", { name: /Turnos \(\d+\)/ })
    .innerText();
  if (turnos.includes("(0)")) throw new Error("profissional sem turnos automáticos");
  console.log(`   profissional ok — ${turnos}`);

  log("6. Horários de funcionamento: abrindo todos os dias");
  await page.goto(`${BASE}/app/hours`);
  const dayRows = page
    .locator("section", { hasText: "Horário de funcionamento" })
    .first()
    .locator("li");
  const n = await dayRows.count();
  for (let i = 0; i < n; i++) {
    const cb = dayRows.nth(i).locator('input[type="checkbox"]');
    if (!(await cb.isChecked())) await cb.check();
  }
  await page.getByRole("button", { name: "Salvar horários" }).click();
  await page.waitForTimeout(1500);
  console.log("   horários salvos");

  log("6b. Configurações: publicando a página");
  await page.goto(`${BASE}/app/settings`);
  const pubCb = page.locator('input[type="checkbox"]');
  if (!(await pubCb.isChecked())) await pubCb.check();
  await page.getByRole("button", { name: "Salvar configurações" }).click();
  await page.waitForTimeout(1500);
  console.log("   publicado");

  log("7. Reserva pública (cliente, contexto anônimo)");
  const ctxClient = await browser.newContext({ viewport: { width: 500, height: 900 } });
  const pub = await ctxClient.newPage();
  pub.setDefaultTimeout(20000);
  await pub.goto(`${BASE}/${SLUG}`);
  await pub.getByText("Corte E2E").click();
  // único profissional → vai direto para data/horário
  await pub.getByText("Escolha data e horário").waitFor();
  // amanhã = 2º chip de dia
  await pub.locator("button:has(span.font-semibold)").nth(1).click();
  const slot = pub.locator("div.grid button").first();
  await slot.waitFor({ timeout: 30000 });
  const slotLabel = await slot.innerText();
  await slot.click();
  await pub.getByPlaceholder("Seu nome").fill("Cliente E2E");
  await pub.getByPlaceholder("(11) 99999-9999").fill("11999990000");
  if (process.env.E2E_EMAIL) {
    await pub
      .getByPlaceholder("Para receber lembrete do horário")
      .fill(process.env.E2E_EMAIL);
  }
  await pub.getByRole("button", { name: "Reservar horário" }).click();
  await pub.getByText("Horário reservado!").waitFor({ timeout: 30000 });
  await pub.screenshot({ path: `${ART}/07-reserva.png` });
  console.log(`   reserva feita (${slotLabel}) — sinal de 50% exibido`);
  await ctxClient.close();

  log("8. Painel: agendamento aparece na agenda de amanhã");
  await page.goto(`${BASE}/app`);
  await page.getByLabel("Próximo dia").click();
  await page.getByText("Cliente E2E").waitFor({ timeout: 15000 });
  await page.screenshot({ path: `${ART}/08-agenda.png` });
  console.log("   agendamento visível no painel");

  log("8b. Confirmando o sinal (Pix recebido)");
  await page.getByRole("button", { name: "Pix do sinal recebido" }).click();
  await page.getByText("✓ pago").waitFor({ timeout: 15000 });
  console.log("   agendamento confirmado");

  if (process.env.E2E_SKIP_BILLING) {
    console.log("\n(billing pulado — Asaas em produção cobra de verdade)");
    console.log("\n✅ E2E (sem billing) — todos os passos passaram.");
    console.log(`   negócio: ${BASE}/${SLUG} | login: ${EMAIL}`);
    await browser.close();
    process.exit(0);
  }

  log("9. Billing: assinando o Plano Único (Asaas sandbox)");
  await page.goto(`${BASE}/app/billing`);
  await page.getByPlaceholder("000.000.000-00").fill(CPF);
  await page.getByRole("button", { name: "Assinar agora" }).click();
  await page.waitForURL(/asaas/, { timeout: 60000 });
  console.log("   fatura Asaas aberta →", page.url().slice(0, 80));
  await page.screenshot({ path: `${ART}/09-fatura-asaas.png` });

  log("10. Webhook: simulando pagamento confirmado");
  const subRow = await supaAdmin(
    `/rest/v1/subscriptions?select=asaas_subscription_id,status&order=created_at.desc&limit=1`
  );
  const asaasSubId = subRow.json?.[0]?.asaas_subscription_id;
  if (!asaasSubId) throw new Error(`subscription row: ${subRow.text}`);
  console.log("   asaas_subscription_id:", asaasSubId, "| status:", subRow.json[0].status);
  const wh = await fetch(`${BASE}/api/webhooks/asaas`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "asaas-access-token": WEBHOOK_TOKEN },
    body: JSON.stringify({
      event: "PAYMENT_RECEIVED",
      payment: { id: "pay_e2e", subscription: asaasSubId, status: "RECEIVED", dueDate: "2026-10-06" },
    }),
  });
  if (!wh.ok) throw new Error(`webhook: ${wh.status} ${await wh.text()}`);
  const after = await supaAdmin(
    `/rest/v1/subscriptions?select=status&asaas_subscription_id=eq.${asaasSubId}`
  );
  if (after.json?.[0]?.status !== "active") throw new Error(`status pós-webhook: ${after.text}`);
  console.log("   assinatura ATIVA ✅");

  log("11. Billing na UI mostra assinatura ativa");
  await page.goto(`${BASE}/app/billing`);
  await page.getByText("Assinatura ativa").waitFor({ timeout: 15000 });
  await page.screenshot({ path: `${ART}/11-assinatura-ativa.png` });

  console.log("\n✅ E2E COMPLETO — todos os passos passaram.");
  console.log(`   negócio: ${BASE}/${SLUG} | login: ${EMAIL}`);
} catch (err) {
  console.error(`\n❌ FALHOU no passo: ${step}`);
  console.error(err?.message ?? err);
  try { await page.screenshot({ path: `${ART}/falha.png`, fullPage: true }); } catch {}
  process.exitCode = 1;
} finally {
  await browser.close();
}
