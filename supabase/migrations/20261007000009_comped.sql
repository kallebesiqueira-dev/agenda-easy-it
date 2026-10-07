-- Modalidade cortesia: negócio isento de assinatura (uso interno/fundador).
-- Com comped = true, painel e página pública nunca bloqueiam por billing.
alter table public.businesses
  add column if not exists comped boolean not null default false;
