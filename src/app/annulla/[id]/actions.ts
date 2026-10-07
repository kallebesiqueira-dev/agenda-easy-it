"use server";

/**
 * Annullamento da parte del cliente stesso, autenticato dal cancel_token
 * (link segreto consegnato alla prenotazione). Regola: fino a 2h prima dell'inizio.
 */

import { z } from "zod";
import { formatDateTimeInTz } from "@/lib/dates";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  emailLayout,
  escapeHtml,
  getOwnerEmail,
  sendEmail,
} from "@/lib/notifications";
import { uuidSchema } from "@/lib/validation";

const MIN_CANCEL_HOURS = 2;

const inputSchema = z.object({ id: uuidSchema, token: uuidSchema });

export async function cancelBookingPublic(
  id: string,
  token: string
): Promise<{ error?: string }> {
  const parsed = inputSchema.safeParse({ id, token });
  if (!parsed.success) return { error: "Link non valido." };

  const supabase = createSupabaseAdminClient();
  const cutoff = new Date(
    Date.now() + MIN_CANCEL_HOURS * 60 * 60 * 1000
  ).toISOString();

  const { data: cancelled, error } = await supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", parsed.data.id)
    .eq("cancel_token", parsed.data.token)
    .in("status", ["awaiting_deposit", "confirmed"])
    .gt("starts_at", cutoff)
    .select(
      "starts_at, business:businesses(id, name, timezone), service:services(name), customer:customers(name, phone)"
    )
    .maybeSingle();

  if (error) {
    console.error("cancelBookingPublic error", error);
    return { error: "Annullamento non riuscito. Riprova." };
  }
  if (!cancelled) {
    return {
      error: `Annullamento non riuscito — il limite è fino a ${MIN_CANCEL_HOURS}h prima dell'orario (oppure la prenotazione è già stata chiusa).`,
    };
  }

  // Avvisa il titolare (best-effort)
  try {
    const rec = cancelled as unknown as {
      starts_at: string;
      business: { id: string; name: string; timezone: string } | null;
      service: { name: string } | null;
      customer: { name: string; phone: string } | null;
    };
    const ownerEmail = rec.business ? await getOwnerEmail(rec.business.id) : null;
    if (ownerEmail && rec.business) {
      const when = formatDateTimeInTz(rec.starts_at, rec.business.timezone);
      await sendEmail({
        to: ownerEmail,
        subject: `Prenotazione annullata dal cliente — ${when}`,
        html: emailLayout(`Annullamento presso ${rec.business.name}`, [
          { raw: `<strong>${escapeHtml(rec.customer?.name ?? "Cliente")}</strong> (${escapeHtml(rec.customer?.phone ?? "")}) ha annullato <strong>${escapeHtml(rec.service?.name ?? "")}</strong> del ${when}.` },
          "L'orario è di nuovo disponibile sulla tua pagina.",
        ]),
      });
    }
  } catch (err) {
    console.error("cancel notify error", err);
  }

  return {};
}
