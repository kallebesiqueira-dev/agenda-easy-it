-- Billing do SaaS: assinatura única (Plano Único R$ 49,90/mês) via Asaas.
-- Uma assinatura por negócio. Escrita SOMENTE via service role (checkout e
-- webhook); membros apenas leem o próprio status.

create type public.subscription_status as enum (
  'trialing',   -- em teste grátis ou aguardando 1º pagamento
  'active',     -- pagamento em dia
  'past_due',   -- cobrança vencida (bloqueia após carência, no app)
  'canceled'
);

create table public.subscriptions (
  business_id uuid primary key references public.businesses (id) on delete cascade,
  asaas_customer_id text,
  asaas_subscription_id text unique,
  status public.subscription_status not null default 'trialing',
  trial_ends_at timestamptz not null,
  overdue_since timestamptz,
  last_paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy subscriptions_member_select on public.subscriptions
  for select using (public.is_business_member(business_id));
-- Sem policies de escrita: apenas service role (bypassa RLS).
