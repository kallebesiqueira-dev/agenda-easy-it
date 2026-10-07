-- Hardening de PII (auditoria 2026-10-07):
-- SEC-001: e-mail de lembrete passa a viver no AGENDAMENTO (não no cliente),
--          e reserva pública não sobrescreve mais o nome de cliente existente
--          (identidade é business+telefone; terceiros não podem "renomear").
-- SEC-002: anon só lê as colunas públicas de businesses (pix_key e phone
--          ficam fora do alcance do PostgREST com a chave pública).

-- E-mail por agendamento (usado só na confirmação/lembrete daquela reserva)
alter table public.appointments
  add column if not exists customer_email text
    check (customer_email is null or char_length(customer_email) <= 120);

-- Reserva não sobrescreve nome de cliente já cadastrado
create or replace function public.create_booking_hold(
  p_business_slug text,
  p_service_id uuid,
  p_professional_id uuid,
  p_starts_at timestamptz,
  p_customer_name text,
  p_customer_phone text,
  p_deposit_method text
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

  select * into v_service
  from public.services s
  where s.id = p_service_id and s.business_id = v_business.id and s.active;
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

  update public.appointments a
     set status = 'cancelled'
   where a.professional_id = p_professional_id
     and a.status = 'awaiting_deposit'
     and a.hold_expires_at is not null
     and a.hold_expires_at < now()
     and tstzrange(a.starts_at, a.ends_at) && tstzrange(p_starts_at, v_ends_at);

  -- SEC-001: em conflito (telefone já conhecido), MANTÉM o nome existente.
  insert into public.customers as c (business_id, name, phone)
  values (v_business.id, p_customer_name, p_customer_phone)
  on conflict (business_id, phone)
    do update set name = c.name
  returning id into v_customer_id;

  begin
    insert into public.appointments (
      business_id, customer_id, professional_id, service_id,
      starts_at, ends_at, status,
      service_price_minor, deposit_due_minor, hold_expires_at, notes
    ) values (
      v_business.id, v_customer_id, p_professional_id, p_service_id,
      p_starts_at, v_ends_at, 'awaiting_deposit',
      v_service.price_minor,
      ceil(v_service.price_minor / 2.0)::integer,
      now() + public.booking_hold_ttl(),
      case p_deposit_method
        when 'pix' then 'Sinal combinado via Pix'
        when 'cash' then 'Sinal combinado em dinheiro, presencial'
        else null
      end
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
    'deposit_due_minor', v_appointment.deposit_due_minor,
    'hold_expires_at', v_appointment.hold_expires_at,
    'pix_key', case when p_deposit_method = 'pix' then v_business.pix_key end
  );
end;
$$;

revoke execute on function public.create_booking_hold from public, anon, authenticated;
grant execute on function public.create_booking_hold to service_role;

-- SEC-002: anon não lê pix_key nem phone de businesses
revoke select on public.businesses from anon;
grant select (
  id, slug, name, business_type, custom_professional_label,
  logo_path, cover_path, cover_position, brand_primary,
  address, whatsapp, timezone, published, comped, created_at
) on public.businesses to anon;
