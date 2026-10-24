-- Prodotti, piani/promozioni e rimozione dell'acconto del 50%.
--
-- 1) services.item_type: 'service' (prenotabile) o 'product' (vetrina, non prenotabile)
-- 2) plans: piani e promozioni liberamente editabili (titolo, descrizione, prezzo
--    opzionale, badge) mostrati sulla pagina pubblica
-- 3) l'acconto sparisce: la prenotazione nasce già 'confirmed', senza retenzione.
--    Le colonne storiche (deposit_due_minor, deposit_paid_at, pix_key) restano
--    per i dati esistenti ma non vengono più scritte.

-- ---------------------------------------------------------------------------
-- 1) Servizi vs prodotti
-- ---------------------------------------------------------------------------

alter table public.services
  add column if not exists item_type text not null default 'service'
  check (item_type in ('service', 'product'));

-- ---------------------------------------------------------------------------
-- 2) Piani e promozioni (tutto editabile: prezzo opzionale per promo "porta
--    un amico", badge libero, ordinamento manuale)
-- ---------------------------------------------------------------------------

-- Una bozza abbandonata (migrazione orfana del 2026-10-24, poi rimossa dallo
-- storico) aveva già creato una relazione "plans" mai esposta all'app: via.
drop table if exists public.plans cascade;

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  title text not null check (char_length(title) between 2 and 80),
  description text check (char_length(description) <= 600),
  price_minor integer check (price_minor > 0 and price_minor <= 100000000),
  price_suffix text check (char_length(price_suffix) <= 30), -- es. "/mese", "a seduta"
  badge text check (char_length(badge) <= 30),               -- es. "Promo", "Più scelto"
  active boolean not null default true,
  sort_order integer not null default 0 check (sort_order between 0 and 999),
  created_at timestamptz not null default now()
);

create index if not exists plans_business_idx on public.plans (business_id, sort_order);

alter table public.plans enable row level security;

-- membri leggono i propri; il pubblico legge solo piani attivi di pagine pubblicate
create policy plans_select on public.plans
  for select using (
    public.is_business_member(business_id)
    or (active and public.is_business_published(business_id))
  );
create policy plans_manage on public.plans
  for all using (public.is_business_manager(business_id))
  with check (public.is_business_manager(business_id));

grant select on public.plans to anon;
grant select, insert, update, delete on public.plans to authenticated;

-- ---------------------------------------------------------------------------
-- 3) Via l'acconto: prenotazione diretta come 'confirmed'
-- ---------------------------------------------------------------------------

-- Retenzioni legacy: quelle ancora valide diventano prenotazioni confermate,
-- quelle scadute vengono annullate (l'orario era già tornato libero).
-- Guardia: su database già migrati da una bozza precedente l'enum non ha più
-- 'awaiting_deposit' — plpgsql pianifica gli UPDATE solo se il valore esiste.
do $$
begin
  if exists (
    select 1 from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'appointment_status'
      and e.enumlabel = 'awaiting_deposit'
  ) then
    update public.appointments
       set status = 'confirmed', hold_expires_at = null
     where status = 'awaiting_deposit'
       and (hold_expires_at is null or hold_expires_at >= now());

    update public.appointments
       set status = 'cancelled', hold_expires_at = null
     where status = 'awaiting_deposit';
  end if;
end $$;

alter table public.appointments alter column status set default 'confirmed';

-- Storico preservato: la colonna resta (dove esiste ancora), ma le nuove
-- righe non la valorizzano.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'appointments'
      and column_name = 'deposit_due_minor'
  ) then
    alter table public.appointments alter column deposit_due_minor drop not null;
  end if;
end $$;

-- Le vecchie funzioni dell'acconto non servono più.
drop function if exists public.create_booking_hold(text, uuid, uuid, timestamptz, text, text, text);
drop function if exists public.confirm_deposit(uuid, public.payment_method);
drop function if exists public.booking_hold_ttl();

-- RPC atomica della prenotazione pubblica: upsert del cliente + insert della
-- prenotazione (già confermata) in un'unica transazione, con l'exclusion
-- constraint come giudice finale contro le corse.
drop function if exists public.create_booking(text, uuid, uuid, timestamptz, text, text);
create function public.create_booking(
  p_business_slug text,
  p_service_id uuid,
  p_professional_id uuid,
  p_starts_at timestamptz,
  p_customer_name text,
  p_customer_phone text
)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_business public.businesses%rowtype;
  v_service public.services%rowtype;
  v_ends_at timestamptz;
  v_customer_id uuid;
  v_appointment public.appointments%rowtype;
begin
  select * into v_business
  from public.businesses b
  where b.slug = p_business_slug and b.published;
  if not found then
    raise exception 'business_not_found';
  end if;

  -- Solo i servizi sono prenotabili: i prodotti sono vetrina.
  select * into v_service
  from public.services s
  where s.id = p_service_id
    and s.business_id = v_business.id
    and s.active
    and s.item_type = 'service';
  if not found then
    raise exception 'service_not_found';
  end if;

  perform 1 from public.professionals p
  where p.id = p_professional_id and p.business_id = v_business.id and p.active;
  if not found then
    raise exception 'professional_not_found';
  end if;

  if p_starts_at <= now() then
    raise exception 'slot_in_past';
  end if;

  v_ends_at := p_starts_at + make_interval(mins => v_service.duration_minutes);

  -- SEC-001: in caso di conflitto (telefono già noto), MANTIENE il nome esistente.
  insert into public.customers as c (business_id, name, phone)
  values (v_business.id, p_customer_name, p_customer_phone)
  on conflict (business_id, phone)
    do update set name = c.name
  returning id into v_customer_id;

  begin
    insert into public.appointments (
      business_id, customer_id, professional_id, service_id,
      starts_at, ends_at, status, service_price_minor
    ) values (
      v_business.id, v_customer_id, p_professional_id, p_service_id,
      p_starts_at, v_ends_at, 'confirmed',
      v_service.price_minor
    )
    returning * into v_appointment;
  exception
    when exclusion_violation then
      raise exception 'slot_taken';
  end;

  return jsonb_build_object(
    'appointment_id', v_appointment.id,
    'status', v_appointment.status,
    'starts_at', v_appointment.starts_at,
    'ends_at', v_appointment.ends_at,
    'service_price_minor', v_appointment.service_price_minor,
    'cancel_token', v_appointment.cancel_token
  );
end;
$$;

revoke execute on function public.create_booking from public, anon, authenticated;
grant execute on function public.create_booking to service_role;
