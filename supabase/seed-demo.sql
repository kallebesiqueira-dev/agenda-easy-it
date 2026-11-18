-- Conta demo permanente di Agenda Easy (Studio Anna, comped).
-- Idempotente: si può rieseguire. Prima di lanciarlo, sostituisci
-- __DEMO_PASSWORD__ con la password reale (minimo 8 caratteri).
-- Non committare la password vera.
--
-- Utente: demo@agendaeasy.it
-- Pagina: /studio-anna

create extension if not exists pgcrypto;

do $$
declare
  v_pw text := '__DEMO_PASSWORD__';
  v_email text := 'demo@agendaeasy.it';
  v_user uuid;
  v_business uuid := 'd1111111-1111-4111-8111-111111111111';
  v_cut uuid := 'd2222222-2222-4222-8222-222222222201';
  v_colour uuid := 'd2222222-2222-4222-8222-222222222202';
  v_nails uuid := 'd2222222-2222-4222-8222-222222222203';
  v_oil uuid := 'd2222222-2222-4222-8222-222222222204';
  v_anna uuid := 'd3333333-3333-4333-8333-333333333301';
  v_giulia uuid := 'd3333333-3333-4333-8333-333333333302';
  v_day date;
begin
  if v_pw = '__DEMO_PASSWORD__' or char_length(v_pw) < 8 then
    raise exception 'Sostituisci __DEMO_PASSWORD__ con la password della demo (minimo 8 caratteri) prima di eseguire.';
  end if;

  select id into v_user from auth.users where email = v_email;

  if v_user is null then
    v_user := 'a1111111-1111-4111-8111-111111111111';
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change, email_change_token_new,
      is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000',
      v_user,
      'authenticated',
      'authenticated',
      v_email,
      crypt(v_pw, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"Demo Agenda Easy"}'::jsonb,
      now(),
      now(),
      '',
      '',
      '',
      '',
      false,
      false
    );
  else
    update auth.users
       set encrypted_password = crypt(v_pw, gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
           updated_at = now()
     where id = v_user;
  end if;

  delete from auth.identities
   where user_id = v_user and provider = 'email';

  insert into auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(),
    v_user,
    jsonb_build_object('sub', v_user::text, 'email', v_email, 'email_verified', true),
    'email',
    v_user::text,
    now(),
    now(),
    now()
  );

  insert into public.businesses (
    id, slug, name, business_type, brand_primary, address, phone, whatsapp,
    timezone, country_code, published, comped
  ) values (
    v_business, 'studio-anna', 'Studio Anna', 'hair_salon', '#7c3aed',
    'Via Roma 18, Milano', '0212345678', '3331001001',
    'Europe/Rome', 'IT', true, true
  )
  on conflict (id) do update set
    slug = excluded.slug,
    name = excluded.name,
    brand_primary = excluded.brand_primary,
    address = excluded.address,
    phone = excluded.phone,
    whatsapp = excluded.whatsapp,
    timezone = excluded.timezone,
    country_code = excluded.country_code,
    published = true,
    comped = true;

  insert into public.business_members (business_id, user_id, role, invite_status)
  values (v_business, v_user, 'owner', 'accepted')
  on conflict (business_id, user_id) do update set
    role = 'owner',
    invite_status = 'accepted';

  delete from public.payments where business_id = v_business;
  delete from public.appointments where business_id = v_business;
  delete from public.customers where business_id = v_business;
  delete from public.plans where business_id = v_business;
  delete from public.breaks where business_id = v_business;
  delete from public.professional_shifts where business_id = v_business;
  delete from public.professionals where business_id = v_business;
  delete from public.business_hours where business_id = v_business;
  delete from public.services where business_id = v_business;

  insert into public.services (id, business_id, item_type, name, description, price_minor, currency, duration_minutes) values
    (v_cut, v_business, 'service', 'Taglio + piega', 'Taglio su misura e piega.', 4500, 'EUR', 60),
    (v_colour, v_business, 'service', 'Colore', 'Colore completo, dalla diagnosi al risciacquo.', 9000, 'EUR', 120),
    (v_nails, v_business, 'service', 'Manicure', 'Manicure curativa.', 2500, 'EUR', 45),
    (v_oil, v_business, 'product', 'Olio capelli', 'Flacone da 50 ml, in vetrina.', 1800, 'EUR', 5);

  insert into public.plans (business_id, title, description, price_minor, price_suffix, badge, sort_order) values
    (v_business, 'Abbonamento mensile', 'Un taglio al mese, prenoti quando vuoi.', 3900, '/mese', 'Più scelto', 0),
    (v_business, 'Porta un''amica', 'Martedì e mercoledì, −10% sul colore se venite in due.', null, '−10%', 'Promo', 1);

  insert into public.professionals (id, business_id, display_name) values
    (v_anna, v_business, 'Anna'),
    (v_giulia, v_business, 'Giulia');

  insert into public.business_hours (business_id, weekday, opens_at, closes_at, is_closed)
  select v_business, d, '09:00', '19:00', d = 0
  from generate_series(0, 6) as d;

  insert into public.professional_shifts (business_id, professional_id, weekday, starts_at, ends_at)
  select v_business, p, d, '09:00', '18:00'
  from generate_series(1, 6) as d
  cross join (values (v_anna), (v_giulia)) as pros(p);

  insert into public.breaks (business_id, professional_id, weekday, starts_at, ends_at)
  select v_business, null, d, '13:00', '14:00'
  from generate_series(1, 6) as d;

  insert into public.customers (id, business_id, name, phone, email) values
    ('d4444444-4444-4444-8444-444444444401', v_business, 'Sara Bianchi', '3331001002', 'sara.bianchi@example.com'),
    ('d4444444-4444-4444-8444-444444444402', v_business, 'Luca Moretti', '3331001003', 'luca.moretti@example.com'),
    ('d4444444-4444-4444-8444-444444444403', v_business, 'Elena Galli', '3331001004', null),
    ('d4444444-4444-4444-8444-444444444404', v_business, 'Giulia Conti', '3331001005', 'giulia.conti@example.com'),
    ('d4444444-4444-4444-8444-444444444405', v_business, 'Marco Riva', '3331001006', null);

  v_day := (now() at time zone 'Europe/Rome')::date;

  insert into public.appointments (
    business_id, customer_id, professional_id, service_id,
    starts_at, ends_at, status, service_price_minor, lang
  )
  select v_business, row.customer_id, row.professional_id, row.service_id,
         ((v_day + row.day_offset) + row.start_at) at time zone 'Europe/Rome',
         ((v_day + row.day_offset) + row.start_at + make_interval(mins => row.minutes)) at time zone 'Europe/Rome',
         row.status::public.appointment_status,
         row.price,
         'it'
  from (values
    (-3, time '10:00', 60, 'd4444444-4444-4444-8444-444444444401'::uuid, v_anna, v_cut, 'completed', 4500),
    (-2, time '11:00', 120, 'd4444444-4444-4444-8444-444444444402'::uuid, v_giulia, v_colour, 'completed', 9000),
    (-1, time '15:00', 45, 'd4444444-4444-4444-8444-444444444405'::uuid, v_anna, v_nails, 'no_show', 2500),
    (-1, time '16:00', 60, 'd4444444-4444-4444-8444-444444444403'::uuid, v_giulia, v_cut, 'cancelled', 4500),
    (0, time '09:30', 60, 'd4444444-4444-4444-8444-444444444401'::uuid, v_anna, v_cut, 'confirmed', 4500),
    (0, time '11:00', 120, 'd4444444-4444-4444-8444-444444444402'::uuid, v_giulia, v_colour, 'confirmed', 9000),
    (0, time '15:00', 45, 'd4444444-4444-4444-8444-444444444403'::uuid, v_anna, v_nails, 'confirmed', 2500),
    (1, time '10:30', 60, 'd4444444-4444-4444-8444-444444444404'::uuid, v_anna, v_cut, 'confirmed', 4500),
    (1, time '16:00', 45, 'd4444444-4444-4444-8444-444444444405'::uuid, v_giulia, v_nails, 'confirmed', 2500),
    (3, time '09:00', 120, 'd4444444-4444-4444-8444-444444444401'::uuid, v_giulia, v_colour, 'confirmed', 9000)
  ) as row(day_offset, start_at, minutes, customer_id, professional_id, service_id, status, price);
end $$;
