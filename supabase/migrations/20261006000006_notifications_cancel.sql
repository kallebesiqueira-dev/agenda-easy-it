-- Suporte a lembretes por e-mail e cancelamento pelo cliente.

-- E-mail opcional do cliente final (para lembrete 24h antes).
alter table public.customers
  add column if not exists email text
    check (email is null or char_length(email) <= 120);

-- cancel_token: link secreto de cancelamento entregue só a quem reservou.
-- reminded_at: marca que o lembrete 24h já foi enviado (idempotência do cron).
alter table public.appointments
  add column if not exists cancel_token uuid not null default gen_random_uuid(),
  add column if not exists reminded_at timestamptz;

create index if not exists appointments_reminder_idx
  on public.appointments (starts_at)
  where status = 'confirmed' and reminded_at is null;
