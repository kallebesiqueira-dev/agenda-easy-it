/**
 * POST /api/public/bookings — crea la ritenzione della prenotazione (awaiting_deposit).
 *
 * Flusso: valida l'input (Zod) → ricalcola la disponibilità sul server →
 * sceglie il professionista ("qualsiasi disponibile" quando null) → RPC atomica
 * create_booking_hold (service role; l'exclusion constraint del database decide
 * le gare all'ultimo millisecondo).
 */

import type { BookingHoldResult } from "@/types/database";
import { publicBookingSchema } from "@/lib/validation";
import { formatDateTimeInTz, zonedTimeToUtc } from "@/lib/dates";
import { getLang } from "@/lib/i18n/server";
import { formatEUR } from "@/lib/money";
import { AvailabilityError, getDayAvailability } from "@/lib/availability/query";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { emailLayout, escapeHtml, sendEmail } from "@/lib/notifications";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://agendaeasy.it";

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

  // Riconvalida sul server: l'orario richiesto deve stare tra gli slot che il
  // motore offre ADESSO (copre apertura, pause, anticipo minimo).
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
  // "Qualsiasi disponibile": primo professionista libero nell'orario.
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
  // Lingua scelta dal cliente nel browser (cookie) — salvata sulla prenotazione
  // per conferma e promemoria nella stessa lingua.
  const lang = await getLang();

  // Complementi post-prenotazione (non possono far fallire la risposta):
  // cancel_token per il link di annullamento e conferma via e-mail AL CLIENTE
  // (quando fornita). Il titolare non riceve e-mail per prenotazione — segue dal pannello.
  try {
    const { data: appt } = await supabase
      .from("appointments")
      .select("cancel_token")
      .eq("id", booking.appointment_id)
      .single();
    booking.cancel_token = appt?.cancel_token ?? "";

    await supabase
      .from("appointments")
      .update({
        lang,
        ...(input.customer_email
          ? // SEC-001: l'e-mail resta sulla PRENOTAZIONE (vale solo per questa) —
            // non sovrascrive mai la scheda del cliente identificato dal telefono.
            { customer_email: input.customer_email }
          : {}),
      })
      .eq("id", booking.appointment_id);

    if (input.customer_email) {
      const { data: service } = await supabase
        .from("services")
        .select("name")
        .eq("id", input.service_id)
        .single();
      const when = formatDateTimeInTz(booking.starts_at, business.timezone, lang);
      const deadline = formatDateTimeInTz(
        booking.hold_expires_at,
        business.timezone,
        lang
      );
      const amount = formatEUR(booking.deposit_due_minor);
      const cancelUrl = `${SITE_URL}/annulla/${encodeURIComponent(booking.appointment_id)}?t=${encodeURIComponent(booking.cancel_token)}`;

      const subject =
        lang === "en"
          ? `Booking received: ${service?.name ?? "service"} — ${business.name}`
          : `Prenotazione ricevuta: ${service?.name ?? "servizio"} — ${business.name}`;
      const lines =
        lang === "en"
          ? [
              { raw: `<strong>${escapeHtml(service?.name ?? "")}</strong> at <strong>${escapeHtml(business.name)}</strong>: <strong>${when}</strong>.` },
              { raw: `To confirm, pay the <strong>${amount}</strong> deposit by ${deadline}${booking.pix_key ? ` (payment details: <code>${escapeHtml(booking.pix_key)}</code>)` : ""}.` },
              { raw: `Change of plans? <a href="${cancelUrl}">Cancel here</a> (up to 2h before).` },
            ]
          : [
              { raw: `<strong>${escapeHtml(service?.name ?? "")}</strong> presso <strong>${escapeHtml(business.name)}</strong>: <strong>${when}</strong>.` },
              { raw: `Per confermare, paga l'acconto di <strong>${amount}</strong> entro ${deadline}${booking.pix_key ? ` (coordinate di pagamento: <code>${escapeHtml(booking.pix_key)}</code>)` : ""}.` },
              { raw: `Imprevisto? <a href="${cancelUrl}">Annulla da qui</a> (fino a 2h prima).` },
            ];
      await sendEmail({
        to: input.customer_email,
        subject,
        html: emailLayout(
          lang === "en"
            ? `Booking received, ${input.customer_name}!`
            : `Prenotazione ricevuta, ${input.customer_name}!`,
          lines,
          lang
        ),
      });
    }
  } catch (err) {
    console.error("pos-booking extras error", err);
  }

  return Response.json({ booking }, { status: 201 });
}
