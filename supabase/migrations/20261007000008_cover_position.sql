-- Enquadramento vertical da capa (0 = topo, 50 = centro, 100 = base).
alter table public.businesses
  add column if not exists cover_position smallint not null default 50
    check (cover_position between 0 and 100);
