-- Lembrete "poche ore prima" (~2h) + reconquista (win-back) após ~15 dias.

-- Idempotência do lembrete a poche ore: marca que já foi enviado.
alter table public.appointments
  add column if not exists reminded_2h_at timestamptz;

create index if not exists appointments_reminder_2h_idx
  on public.appointments (starts_at)
  where status = 'confirmed' and reminded_2h_at is null;

-- Idempotência do win-back: marca que o e-mail de reconquista já foi enviado.
alter table public.customers
  add column if not exists winback_sent_at timestamptz;

-- Clientes da reconquista: têm e-mail, nunca receberam o win-back, a última
-- visita foi entre p_gap_days e p_max_days atrás, e não têm nada marcado à
-- frente. Roda só via service role no cron (security definer + grant revogado).
create or replace function public.customers_for_winback(
  p_gap_days int default 15,
  p_max_days int default 45
)
returns table (
  id uuid,
  business_id uuid,
  name text,
  email text,
  business_name text,
  whatsapp text,
  slug text,
  lang text
)
language sql
security definer
set search_path = public
as $$
  select c.id, c.business_id, c.name, c.email,
         b.name as business_name, b.whatsapp, b.slug,
         coalesce(
           (select a.lang from public.appointments a
             where a.customer_id = c.id
             order by a.starts_at desc limit 1),
           'it'
         ) as lang
  from public.customers c
  join public.businesses b on b.id = c.business_id
  where c.email is not null
    and c.winback_sent_at is null
    and (
      select max(a.starts_at) from public.appointments a
      where a.customer_id = c.id
    ) between now() - make_interval(days => p_max_days)
          and now() - make_interval(days => p_gap_days)
    and not exists (
      select 1 from public.appointments a
      where a.customer_id = c.id
        and a.starts_at > now()
        and a.status in ('confirmed', 'awaiting_deposit')
    );
$$;

revoke all on function public.customers_for_winback(int, int) from public;
revoke all on function public.customers_for_winback(int, int) from anon;
revoke all on function public.customers_for_winback(int, int) from authenticated;
