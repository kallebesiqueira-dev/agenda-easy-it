-- Account di cortesia permanente per il fondatore.
--
-- kallebesiqueira@gmail.com non paga mai l'abbonamento: ogni business di cui
-- è owner è (e resta) comped = true — sia quelli già esistenti sia quelli
-- creati in futuro (trigger su business_members).

create or replace function public.comp_founder_business()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if new.role = 'owner' and exists (
    select 1 from auth.users u
    where u.id = new.user_id
      and lower(u.email) = 'kallebesiqueira@gmail.com'
  ) then
    update public.businesses set comped = true where id = new.business_id;
  end if;
  return new;
end;
$$;

-- Funzione di trigger: nessuna esecuzione diretta dai client.
revoke execute on function public.comp_founder_business from public, anon, authenticated;

drop trigger if exists comp_founder_business on public.business_members;
create trigger comp_founder_business
  after insert on public.business_members
  for each row execute function public.comp_founder_business();

-- Business già esistenti del fondatore.
update public.businesses b
   set comped = true
 where exists (
   select 1
   from public.business_members m
   join auth.users u on u.id = m.user_id
   where m.business_id = b.id
     and m.role = 'owner'
     and lower(u.email) = 'kallebesiqueira@gmail.com'
 );
