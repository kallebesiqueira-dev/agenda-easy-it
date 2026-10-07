-- Seed dimostrativo (solo ambiente locale / dev).
-- Barberia pubblicata e completa per visualizzare la pagina pubblica su /barberia-demo.

insert into public.businesses
  (id, slug, name, business_type, brand_primary, address, whatsapp, phone, timezone, pix_key, published)
values
  ('11111111-1111-4111-8111-111111111111', 'barberia-demo', 'Barberia Demo',
   'barbershop', '#b45309', 'Via delle Forbici, 123 — Centro', '3331112222', '0612345678',
   'Europe/Rome', 'IT60X0542811101000000123456', true);

insert into public.services (id, business_id, name, description, price_minor, duration_minutes) values
  ('22222222-2222-4222-8222-222222222201', '11111111-1111-4111-8111-111111111111', 'Taglio uomo', 'Forbici e macchinetta', 2500, 30),
  ('22222222-2222-4222-8222-222222222202', '11111111-1111-4111-8111-111111111111', 'Barba completa', 'Panno caldo e rasoio', 2000, 30),
  ('22222222-2222-4222-8222-222222222203', '11111111-1111-4111-8111-111111111111', 'Taglio + barba', 'Combo scontato', 4000, 60);

insert into public.professionals (id, business_id, display_name) values
  ('33333333-3333-4333-8333-333333333301', '11111111-1111-4111-8111-111111111111', 'Marco'),
  ('33333333-3333-4333-8333-333333333302', '11111111-1111-4111-8111-111111111111', 'Luca');

-- Lun–sab 09:00–19:00; domenica chiuso
insert into public.business_hours (business_id, weekday, opens_at, closes_at, is_closed)
select '11111111-1111-4111-8111-111111111111', d, '09:00', '19:00', (d = 0)
from generate_series(0, 6) as d;

-- Turni: entrambi lavorano lun–sab 09:00–18:00
insert into public.professional_shifts (business_id, professional_id, weekday, starts_at, ends_at)
select '11111111-1111-4111-8111-111111111111', p.id, d, '09:00', '18:00'
from generate_series(1, 6) as d
cross join (values
  ('33333333-3333-4333-8333-333333333301'::uuid),
  ('33333333-3333-4333-8333-333333333302'::uuid)
) as p(id);

-- Pausa pranzo generale lun–sab
insert into public.breaks (business_id, professional_id, weekday, starts_at, ends_at)
select '11111111-1111-4111-8111-111111111111', null, d, '12:00', '13:00'
from generate_series(1, 6) as d;
