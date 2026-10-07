/** Screenshots mobile (390px) de todas as telas do painel + públicas. Uso interno. */
import { chromium } from "playwright";
import { readFileSync, mkdirSync } from "node:fs";

const BASE = "http://localhost:7778";
mkdirSync("e2e-artifacts/mobile", { recursive: true });

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8").split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);

const ts = Date.now();
const EMAIL = `shots.${ts}@teste.agendaeasy.dev`;
const PASSWORD = "SenhaForte123!";

const res = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users`, {
  method: "POST",
  headers: {
    apikey: env.SUPABASE_SECRET_KEY,
    Authorization: `Bearer ${env.SUPABASE_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD, email_confirm: true }),
});
if (!res.ok) throw new Error(await res.text());

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
page.setDefaultTimeout(20000);

await page.goto(`${BASE}/login`);
await page.getByPlaceholder("voce@exemplo.com").fill(EMAIL);
await page.getByPlaceholder("Mínimo de 8 caracteres").fill(PASSWORD);
await page.getByRole("button", { name: "Entrar" }).click();
await page.waitForURL(/\/app/, { timeout: 30000 });

// onboarding
if (!page.url().includes("onboarding")) await page.goto(`${BASE}/app/onboarding`);
await page.getByPlaceholder("Barbearia do Zé").fill(`Shots Mobile ${ts}`);
await page.getByRole("button", { name: "Criar e ir para o painel" }).click();
await page.waitForURL(/\/app(?!\/onboarding)/, { timeout: 30000 });

// um serviço e um profissional para as listas não ficarem vazias
await page.goto(`${BASE}/app/services`);
await page.getByRole("button", { name: "Novo serviço" }).click();
await page.getByPlaceholder("Corte masculino").fill("Serviço Exemplo Longo Nome");
await page.getByPlaceholder("45,00").fill("55,00");
await page.getByRole("button", { name: "Salvar", exact: true }).click();
await page.waitForTimeout(1200);
await page.goto(`${BASE}/app/professionals`);
await page.getByRole("button", { name: "Adicionar" }).first().click();
await page.locator('input[placeholder^="Nome do"]').fill("Profissional Teste");
await page.getByRole("button", { name: "Salvar", exact: true }).click();
await page.waitForTimeout(1200);

const shots = [
  ["/app", "01-agenda"],
  ["/app/services", "02-servicos"],
  ["/app/professionals", "03-equipe"],
  ["/app/hours", "04-horarios"],
  ["/app/report", "05-relatorios"],
  ["/app/settings", "06-config"],
  ["/app/billing", "07-billing"],
];
for (const [path, name] of shots) {
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  await page.screenshot({ path: `e2e-artifacts/mobile/${name}.png`, fullPage: true });
  console.log(`${name}: overflow-x = ${overflow}px`);
}

// equipe com turnos expandidos (formulário denso)
await page.goto(`${BASE}/app/professionals`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: /Turnos \(/ }).click();
await page.waitForTimeout(400);
await page.screenshot({ path: "e2e-artifacts/mobile/03b-turnos.png", fullPage: true });

// serviço com formulário aberto
await page.goto(`${BASE}/app/services`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Editar" }).first().click();
await page.waitForTimeout(400);
await page.screenshot({ path: "e2e-artifacts/mobile/02b-servico-form.png", fullPage: true });

console.log(`cleanup-email: ${EMAIL}`);
await browser.close();
