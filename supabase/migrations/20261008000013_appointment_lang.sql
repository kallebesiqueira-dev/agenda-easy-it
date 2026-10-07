-- Lingua scelta dal cliente al momento della prenotazione (it/en).
-- Usata per la conferma via e-mail e per il promemoria 24h.

alter table public.appointments
  add column if not exists lang text not null default 'it'
    check (lang in ('it', 'en'));
