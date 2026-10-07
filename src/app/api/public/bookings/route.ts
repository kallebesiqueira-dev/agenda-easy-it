/**
 * POST /api/public/bookings — cria a retenção de reserva (awaiting_deposit).
 *
 * Fluxo: valida entrada (Zod) → recalcula disponibilidade no servidor →
 * escolhe o profissional ("qualquer disponível" quando null) → RPC atômica
 * create_booking_hold (service role; a exclusion constraint do banco decide
 * corridas de último milissegundo).
 */

import type { BookingHoldResult } from "@/types/database";
import { publicBookingSchema } from "@/lib/validation";
import { formatDateTimeInTz, zonedTimeToUtc } from "@/lib/dates";
import { formatBRL } from "@/lib/money";
import { AvailabilityError, getDayAvailability } from "@/lib/availability/query";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { emailLayout, escapeHtml, sendEmail } from "@/lib/notifications";

const RPC_ERROR_STATUS: Record<string, number> = {
  business_not_found: 404,
  service_not_found: 404,
  professional_not_found: 404,
  slot_in_past: 409,
  slot_taken: 409,
};

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = publicBookingSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "invalid_input", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const input = parsed.data;

  const supabase = createSupabaseAdminClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, timezone")
    .eq("slug", input.business_slug)
    .eq("published", true)
    .maybeSingle();
  if (!business) {
    return Response.json({ error: "business_not_found" }, { status: 404 });
  }

  // Revalidação no servidor: o horário pedido precisa estar entre os slots
  // que o motor oferece AGORA (cobre expediente, pausas, antecedência mínima).
  let slots;
  try {
    slots = await getDayAvailability({
      business_slug: input.business_slug,
      service_id: input.service_id,
      professional_id: input.professional_id,
      date: input.date,
    });
  } catch (err) {
    if (err instanceof AvailabilityError) {
      return Response.json({ error: err.code }, { status: 404 });
    }
    throw err;
  }

  const requestedStartIso = zonedTimeToUtc(
    input.date,
    input.start_time,
    business.timezone
  ).toISOString();

  const matching = slots.filter((s) => s.starts_at === requestedStartIso);
  if (matching.length === 0) {
    return Response.json({ error: "slot_unavailable" }, { status: 409 });
  }
  // "Qualquer disponível": primeiro profissional livre no horário.
  const professionalId = input.professional_id ?? matching[0].professional_id;

  const { data, error } = await supabase.rpc("create_booking_hold", {
    p_business_slug: input.business_slug,
    p_service_id: input.service_id,
    p_professional_id: professionalId,
    p_starts_at: requestedStartIso,
    p_customer_name: input.customer_name,
    p_customer_phone: input.customer_phone,
    p_deposit_method: input.deposit_method,
  });

  if (error) {
    const code = Object.keys(RPC_ERROR_STATUS).find((c) =>
      error.message.includes(c)
    );
    if (code) {
      return Response.json({ error: code }, { status: RPC_ERROR_STATUS[code] });
    }
    console.error("create_booking_hold error", error);
    return Response.json({ error: "internal_error" }, { status: 500 });
  }

  const booking = data as BookingHoldResult;

  // Complementos pós-reserva (não podem falhar a resposta): cancel_token
  // para o link de cancelamento e confirmação por e-mail AO CLIENTE (quando
  // informado). O dono não recebe e-mail por reserva — acompanha pelo painel.
  try {
    const { data: appt } = await supabase
      .from("appointments")
      .select("cancel_token")
      .eq("id", booking.appointment_id)
      .single();
    booking.cancel_token = appt?.cancel_token ?? "";

    if (input.customer_email) {
      // SEC-001: o e-mail fica no AGENDAMENTO (vale só para esta reserva) —
      // nunca sobrescreve o cadastro do cliente identificado por telefone.
      await supabase
        .from("appointments")
        .update({ customer_email: input.customer_email })
        .eq("id", booking.appointment_id);

      const { data: service } = await supabase
        .from("services")
        .select("name")
        .eq("id", input.service_id)
        .single();
      const when = formatDateTimeInTz(booking.starts_at, business.timezone);
      await sendEmail({
        to: input.customer_email,
        subject: `Reserva recebida: ${service?.name ?? "serviço"} — ${business.name}`,
        html: emailLayout(`Reserva recebida, ${input.customer_name}!`, [
          { raw: `<strong>${escapeHtml(service?.name ?? "")}</strong> em <strong>${escapeHtml(business.name)}</strong>: <strong>${when}</strong>.` },
          { raw: `Para confirmar, pague o sinal de <strong>${formatBRL(booking.deposit_due_minor)}</strong> até ${formatDateTimeInTz(booking.hold_expires_at, business.timezone)}${booking.pix_key ? ` (chave Pix: <code>${escapeHtml(booking.pix_key)}</code>)` : ""}.` },
          { raw: `Imprevisto? <a href="https://agenda-easy.vercel.app/cancelar/${encodeURIComponent(booking.appointment_id)}?t=${encodeURIComponent(booking.cancel_token)}">Cancele por aqui</a> (até 2h antes).` },
        ]),
      });
    }
  } catch (err) {
    console.error("pos-booking extras error", err);
  }

  return Response.json({ booking }, { status: 201 });
}
