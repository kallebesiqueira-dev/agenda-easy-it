-- Agenda Easy — esquema inicial do MVP.
-- Espelha src/types/database.ts: IDs uuid, timestamps UTC (timestamptz), dinheiro em centavos.
-- Multi-tenant por business_id com RLS em todas as tabelas.

create extension if not exists btree_gist;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.business_type as enum ('barbershop', 'beauty', 'hair_salon', 'other');
create type public.member_role as enum ('owner', 'manager', 'professional');
create type public.member_invite_status as enum ('pending', 'accepted', 'revoked');
create type public.appointment_status as enum ('awaiting_deposit', 'confirmed', 'cancelled', 'completed', 'no_show');
create type public.payment_purpose as enum ('deposit', 'balance', 'full_payment');
create type public.payment_method as enum ('pix', 'cash', 'card_in_person');
create type public.payment_status as enum ('pending_confirmation', 'recorded', 'refunded', 'void');

-- ---------------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------------

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 40),
  name text not null check (char_length(name) between 2 and 80),
  business_type public.business_type not null,
  custom_professional_label text check (char_length(custom_professional_label) between 2 and 30),
  logo_path text,
  brand_primary text not null default '#18181b' check (brand_primary ~ '^#[0-9a-fA-F]{6}$'),
  address text check (char_length(address) <= 200),
  phone text,
  whatsapp text,
  timezone text not null default 'America/Sao_Paulo',
  country_code text not null default 'BR' check (country_code = 'BR'),
  pix_key text check (char_length(pix_key) <= 140),
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.business_members (
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.member_role not null,
  invite_status public.member_invite_status not null default 'accepted',
  created_at timestamptz not null default now(),
  primary key (business_id, user_id)
);

-- Uma linha por dia da semana; weekday 0 = domingo (convenção JS).
create table public.business_hours (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  opens_at time not null default '09:00',
  closes_at time not null default '18:00',
  is_closed boolean not null default false,
  unique (business_id, weekday),
  check (is_closed or opens_at < closes_at)
);

create table public.professionals (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 60),
  active boolean not null default true,
  image_path text
);

-- Turnos permitem jornada partida: várias linhas por profissional/dia.
create table public.professional_shifts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  professional_id uuid not null references public.professionals (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  starts_at time not null,
  ends_at time not null,
  check (starts_at < ends_at)
);

-- professional_id null = pausa geral do negócio (ex.: almoço de todos).
create table public.breaks (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  professional_id uuid references public.professionals (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  starts_at time not null,
  ends_at time not null,
  check (starts_at < ends_at)
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  description text check (char_length(description) <= 500),
  price_minor integer not null check (price_minor > 0 and price_minor <= 100000000),
  currency text not null default 'BRL' check (currency = 'BRL'),
  duration_minutes integer not null
    check (duration_minutes between 5 and 480 and duration_minutes % 5 = 0),
  image_path text,
  active boolean not null default true
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  phone text not null check (phone ~ '^\d{10,11}$'),
  created_at timestamptz not null default now(),
  unique (business_id, phone)
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  customer_id uuid not null references public.customers (id) on delete restrict,
  professional_id uuid not null references public.professionals (id) on delete restrict,
  service_id uuid not null references public.services (id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.appointment_status not null default 'awaiting_deposit',
  -- Snapshots congelados na reserva: mudanças de preço não afetam reservas existentes.
  service_price_minor integer not null check (service_price_minor > 0),
  deposit_due_minor integer not null
    check (deposit_due_minor > 0 and deposit_due_minor <= service_price_minor),
  deposit_paid_at timestamptz,
  hold_expires_at timestamptz,
  notes text check (char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  check (starts_at < ends_at),
  -- Defesa final contra double-booking: o banco rejeita dois horários
  -- sobrepostos do mesmo profissional, mesmo sob corrida de requisições.
  -- Retenções não pagas (awaiting_deposit) também bloqueiam o horário até expirarem.
  constraint appointments_no_overlap exclude using gist (
    professional_id with =,
    tstzrange(starts_at, ends_at) with &&
  ) where (status in ('awaiting_deposit', 'confirmed'))
);

create index appointments_business_starts_idx on public.appointments (business_id, starts_at);
create index appointments_professional_starts_idx on public.appointments (professional_id, starts_at);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  amount_minor integer not null check (amount_minor > 0 and amount_minor <= 100000000),
  currency text not null default 'BRL' check (currency = 'BRL'),
  purpose public.payment_purpose not null,
  method public.payment_method not null,
  status public.payment_status not null default 'recorded',
  paid_at timestamptz,
  recorded_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

create index payments_appointment_idx on public.payments (appointment_id);
create index payments_business_created_idx on public.payments (business_id, created_at);

-- ---------------------------------------------------------------------------
-- Helpers de autorização (security definer para não recursar nas policies)
-- ---------------------------------------------------------------------------

create or replace function public.is_business_member(target_business uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.business_members m
    where m.business_id = target_business
      and m.user_id = (select auth.uid())
      and m.invite_status = 'accepted'
  );
$$;

create or replace function public.is_business_manager(target_business uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.business_members m
    where m.business_id = target_business
      and m.user_id = (select auth.uid())
      and m.invite_status = 'accepted'
      and m.role in ('owner', 'manager')
  );
$$;

create or replace function public.is_business_published(target_business uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.businesses b
    where b.id = target_business and b.published
  );
$$;

-- ---------------------------------------------------------------------------
-- Onboarding: cria negócio + vínculo de owner atomicamente.
-- (Sem isso não há como passar na RLS: o insert do negócio exige membership
-- que ainda não existe.)
-- ---------------------------------------------------------------------------

create or replace function public.create_business(
  p_name text,
  p_slug text,
  p_business_type public.business_type,
  p_timezone text
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'not_authenticated';
  end if;

  insert into public.businesses (name, slug, business_type, timezone)
  values (p_name, p_slug, p_business_type, p_timezone)
  returning id into v_id;

  insert into public.business_members (business_id, user_id, role, invite_status)
  values (v_id, (select auth.uid()), 'owner', 'accepted');

  return v_id;
end;
$$;

revoke execute on function public.create_business from public, anon;
grant execute on function public.create_business to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.businesses enable row level security;
alter table public.business_members enable row level security;
alter table public.business_hours enable row level security;
alter table public.professionals enable row level security;
alter table public.professional_shifts enable row level security;
alter table public.breaks enable row level security;
alter table public.services enable row level security;
alter table public.customers enable row level security;
alter table public.appointments enable row level security;
alter table public.payments enable row level security;

-- businesses: membros leem o próprio; público lê apenas negócios publicados.
create policy businesses_member_select on public.businesses
  for select using (public.is_business_member(id) or published);
create policy businesses_manager_update on public.businesses
  for update using (public.is_business_manager(id))
  with check (public.is_business_manager(id));
-- Sem policy de insert/delete direto: criação via create_business(); exclusão fora do MVP.

-- business_members: membros veem o time; apenas managers alteram.
create policy members_select on public.business_members
  for select using (public.is_business_member(business_id));
create policy members_manage on public.business_members
  for all using (public.is_business_manager(business_id))
  with check (public.is_business_manager(business_id));

-- Agenda (horários, turnos, pausas): managers gerenciam; membros leem;
-- anon lê de negócios publicados (necessário para calcular disponibilidade).
create policy hours_select on public.business_hours
  for select using (public.is_business_member(business_id) or public.is_business_published(business_id));
create policy hours_manage on public.business_hours
  for all using (public.is_business_manager(business_id))
  with check (public.is_business_manager(business_id));

create policy professionals_select on public.professionals
  for select using (
    public.is_business_member(business_id)
    or (active and public.is_business_published(business_id))
  );
create policy professionals_manage on public.professionals
  for all using (public.is_business_manager(business_id))
  with check (public.is_business_manager(business_id));

create policy shifts_select on public.professional_shifts
  for select using (public.is_business_member(business_id) or public.is_business_published(business_id));
create policy shifts_manage on public.professional_shifts
  for all using (public.is_business_manager(business_id))
  with check (public.is_business_manager(business_id));

create policy breaks_select on public.breaks
  for select using (public.is_business_member(business_id) or public.is_business_published(business_id));
create policy breaks_manage on public.breaks
  for all using (public.is_business_manager(business_id))
  with check (public.is_business_manager(business_id));

create policy services_select on public.services
  for select using (
    public.is_business_member(business_id)
    or (active and public.is_business_published(business_id))
  );
create policy services_manage on public.services
  for all using (public.is_business_manager(business_id))
  with check (public.is_business_manager(business_id));

-- Dados de clientes e financeiro: NUNCA expostos ao anon.
-- Reserva pública será feita por RPC security definer em migração futura.
create policy customers_member_all on public.customers
  for all using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy appointments_member_select on public.appointments
  for select using (public.is_business_member(business_id));
create policy appointments_member_write on public.appointments
  for insert with check (public.is_business_member(business_id));
create policy appointments_member_update on public.appointments
  for update using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy payments_member_select on public.payments
  for select using (public.is_business_member(business_id));
create policy payments_member_insert on public.payments
  for insert with check (public.is_business_member(business_id));
create policy payments_manager_update on public.payments
  for update using (public.is_business_manager(business_id))
  with check (public.is_business_manager(business_id));
