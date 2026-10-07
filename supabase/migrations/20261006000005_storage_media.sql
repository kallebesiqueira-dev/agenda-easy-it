-- Bucket público de mídia (logo do negócio e fotos de serviços).
-- Caminho: {business_id}/{pasta}/{arquivo} — o 1º segmento identifica o dono,
-- e as policies só deixam gestores do negócio gravarem dentro da própria pasta.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy media_public_read on storage.objects
  for select using (bucket_id = 'media');

create policy media_manager_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'media'
    and public.is_business_manager(((storage.foldername(name))[1])::uuid)
  );

create policy media_manager_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'media'
    and public.is_business_manager(((storage.foldername(name))[1])::uuid)
  );

create policy media_manager_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'media'
    and public.is_business_manager(((storage.foldername(name))[1])::uuid)
  );
