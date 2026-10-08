# Checklist de produção — agendaeasy.it 🇮🇹

Este projeto é a versão italiana do Agenda Easy (interface it-IT, EUR, Europe/Rome).
Siga esta ordem para colocar no ar em **https://agendaeasy.it**.

## 1. Supabase (novo projeto para a Itália)

1. Crie um projeto novo em supabase.com (região `eu-central` ou `eu-south` — mais perto da Itália).
2. Vincule e aplique as migrations (inclui `20261008000011_italy_locale.sql`,
   que define EUR / Europe/Rome / IT como padrão e traduz a nota da reserva):
   ```bash
   npx supabase link --project-ref SEU_REF
   npx supabase db push
   ```
3. (Opcional, dev) `supabase/seed.sql` cria a "Barberia Demo" em `/barberia-demo`.
4. Autenticação > URL Configuration:
   - **Site URL:** `https://agendaeasy.it`
   - **Redirect URLs:** `https://agendaeasy.it/auth/callback`
5. Login Google: no Google Cloud Console crie credenciais OAuth Web com
   redirect `https://SEU_REF.supabase.co/auth/v1/callback`, preencha as duas
   variáveis `SUPABASE_AUTH_EXTERNAL_GOOGLE_*` e rode `npx supabase config push`.
6. Traduza os templates de e-mail do Supabase Auth (confirmação de conta e
   recuperação de senha) para italiano em Authentication > Email Templates.

## 2. Vercel

1. Importe este repositório como projeto novo na Vercel.
2. Em Settings > Domains, adicione `agendaeasy.it` (e `www.agendaeasy.it`
   com redirect para o apex). Configure o DNS no registrador (registro A /
   CNAME que a Vercel indicar).
3. Configure as variáveis de ambiente (ver `.env.example`):
   - `NEXT_PUBLIC_SITE_URL=https://agendaeasy.it`
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SECRET_KEY`
   - `RESEND_API_KEY` / `EMAIL_FROM` (ver passo 3)
   - `CRON_SECRET` (valor forte qualquer — a Vercel envia sozinha para o cron)
   - Stripe: `STRIPE_SECRET_KEY` (live), `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET` (ver passo 4)
4. O cron de lembretes já está no `vercel.json` (`0 6 * * *` UTC = 07h/08h em Roma).

## 3. E-mails (Resend)

1. Verifique o domínio `agendaeasy.it` no Resend (registros DKIM/SPF no DNS).
2. `EMAIL_FROM=Agenda Easy <noreply@agendaeasy.it>`.
3. Os templates transacionais do app são bilíngues (it/en) e seguem o
   idioma escolhido pelo cliente na reserva.

## 4. Pagamentos — Stripe 💳

A assinatura do SaaS é cobrada via **Stripe** (Checkout em modo subscription,
EUR, mensal, com os dias restantes do trial convertidos em `trial_period_days`).

Já existem em LIVE na conta Stripe (não versionar IDs reais — anote-os em
local privado):

- Produto **Agenda Easy** com price recorrente de 9,90 EUR/mês →
  `STRIPE_PRICE_ID=price_...` (copie do Dashboard, modo live)
- Customer Portal configurado

Falta apenas (no deploy):

1. **Chave live**: Dashboard em modo LIVE (GALLO CRM) >
   https://dashboard.stripe.com/apikeys > "Create restricted key" com
   permissões de ESCRITA em Customers, Checkout Sessions, Subscriptions e
   Billing Portal → `STRIPE_SECRET_KEY=rk_live_...` (na Vercel, NUNCA no
   .env.local — chave live cobra cartões reais).
2. **Webhook live**: Dashboard > Developers > Webhooks > Add endpoint
   `https://agendaeasy.it/api/webhooks/stripe`, eventos:
   `checkout.session.completed`, `customer.subscription.created`,
   `customer.subscription.updated`, `customer.subscription.deleted`,
   `invoice.paid`, `invoice.payment_failed`. O signing secret vai em
   `STRIPE_WEBHOOK_SECRET` (Vercel). Criar só quando o domínio estiver no
   ar (endpoints com falhas prolongadas são desativados pela Stripe).
3. **Ativação da conta live** (se ainda não estiver): dados da empresa em
   Settings > Business — sem isso a Stripe não processa cobranças reais.
6. Teste local: `stripe listen --forward-to localhost:7778/api/webhooks/stripe`.
7. IVA: se quiser que a Stripe calcule a IVA italiana automaticamente, ative
   o **Stripe Tax** e registre a empresa (Registrations) ANTES de ligar
   `automatic_tax` — sem registro ativo a Stripe não cobra imposto algum.
   O checkout já coleta Codice Fiscale / Partita IVA (`tax_id_collection`).

Observações:
- O trial de 7 dias funciona sem nenhuma configuração de gateway.
- Contas cortesia (`comped = true` no banco) têm acesso permanente sem cobrança.
- O acconto de 50% entre negócio e cliente final NÃO passa pela plataforma
  (o cliente paga direto nas coordenadas — IBAN — do negócio).

## 5. Verificação final

- `npm run build` e `npm run lint` passam sem erros.
- Fluxo completo em produção: cadastro → onboarding → serviços/equipe/horários →
  publicar → reservar em `/{slug}` → e-mail de confirmação → cancelar via link.
- Interface bilíngue (italiano padrão + inglês via seletor), valores em `€`
  (it-IT), datas DD/MM/AAAA, 24h, fuso Europe/Rome.
