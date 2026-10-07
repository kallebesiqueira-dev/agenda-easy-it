-- Capa da página pública (estilo Facebook), editável nas Configurações.
alter table public.businesses add column if not exists cover_path text;
