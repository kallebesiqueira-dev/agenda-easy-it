-- Abbonamento tramite Stripe (mercato italiano, EUR).
-- Le colonne asaas_* restano per compatibilità storica; il gateway attivo è Stripe.

alter table public.subscriptions
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text;

create index if not exists subscriptions_stripe_subscription_id_idx
  on public.subscriptions (stripe_subscription_id);

create index if not exists subscriptions_stripe_customer_id_idx
  on public.subscriptions (stripe_customer_id);
