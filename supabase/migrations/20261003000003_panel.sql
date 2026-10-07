-- Painel: confirmação de sinal atômica (pagamento + mudança de status).
--
-- security INVOKER de propósito: roda com os direitos do membro logado, então
-- a RLS continua valendo — um usuário de outro negócio nem enxerga a linha.
-- A função existe só para garantir que pagamento e status mudem juntos.

create or replace function public.confirm_deposit(
  p_appointment_id uuid,
  p_method public.payment_method
)
returns void
language plpgsql security invoker
set search_path = ''
as $$
declare
  v_appt public.appointments%rowtype;
begin
  select * into v_appt
  from public.appointments a
  where a.id = p_appointment_id
  for update;

  if not found then
    raise exception 'appointment_not_found';
  end if;

  if v_appt.status <> 'awaiting_deposit' then
    raise exception 'invalid_status';
  end if;

  insert into public.payments (
    business_id, appointment_id, amount_minor,
    purpose, method, status, paid_at, recorded_by
  ) values (
    v_appt.business_id, p_appointment_id, v_appt.deposit_due_minor,
    'deposit', p_method, 'recorded', now(), (select auth.uid())
  );

  update public.appointments
     set status = 'confirmed',
         deposit_paid_at = now(),
         hold_expires_at = null
   where id = p_appointment_id;
end;
$$;

revoke execute on function public.confirm_deposit from public, anon;
grant execute on function public.confirm_deposit to authenticated;
