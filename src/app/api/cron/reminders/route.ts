/**
 * GET /api/cron/reminders — gira 1× al giorno (il piano Hobby di Vercel
 * consente solo cron giornalieri). Ricorda via e-mail i clienti con
 * appuntamento confermato nelle prossime 26h non ancora avvisati
 * (reminded_at garantisce l'idempotenza).
 * Protezione: header Authorization: Bearer CRON_SECRET (Vercel lo invia da solo).
 */

import { formatDateTimeInTz } from "@/lib/dates";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { emailLayout, escapeHtml, sendEmail } from "@/lib/notifications";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://agendaeasy.it";

export async function GET(request: Request) {
  // Fail-closed: senza CRON_SECRET configurato, nessuno esegue.
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const now = Date.now();
  // Finestra 1h–27h: copre la mattina presto a Roma e tollera ritardi del cron.
  const from = new Date(now + 1 * 60 * 60 * 1000).toISOString();
  const to = new Date(now + 27 * 60 * 60 * 1000).toISOString();

  const { data: appointments, error } = await supabase
    .from("appointments")
    .select(
      `id, starts_at, cancel_token, customer_email,
       customer:customers(name),
       service:services(name),
       business:businesses(name, timezone, address, whatsapp)`
    )
    .eq("status", "confirmed")
    .is("reminded_at", null)
    .gte("starts_at", from)
    .lt("starts_at", to);

  if (error) {
    console.error("cron reminders query error", error);
    return Response.json({ error: "query_failed" }, { status: 500 });
  }

  let sent = 0;
  for (const a of appointments ?? []) {
    const rec = a as unknown as {
      id: string;
      starts_at: string;
      cancel_token: string;
      customer_email: string | null;
      customer: { name: string } | null;
      service: { name: string } | null;
      business: {
        name: string;
        timezone: string;
        address: string | null;
        whatsapp: string | null;
      } | null;
    };
    if (!rec.customer_email || !rec.business) continue;

    // Marca PRIMA di inviare: se il processo cade a metà, non rimanda spam
    // alla prossima esecuzione (perdere 1 promemoria è meglio che duplicarlo).
    await supabase
      .from("appointments")
      .update({ reminded_at: new Date().toISOString() })
      .eq("id", rec.id);

    const when = formatDateTimeInTz(rec.starts_at, rec.business.timezone);
    await sendEmail({
      to: rec.customer_email,
      subject: `Promemoria: ${rec.service?.name ?? "il tuo appuntamento"} — ${rec.business.name}`,
      html: emailLayout(`Ciao, ${rec.customer?.name ?? ""}! Il tuo appuntamento si avvicina`, [
        { raw: `Il tuo appuntamento di <strong>${escapeHtml(rec.service?.name ?? "")}</strong> presso <strong>${escapeHtml(rec.business.name)}</strong> è <strong>${when}</strong>.` },
        rec.business.address ? `Indirizzo: ${rec.business.address}` : "",
        rec.business.whatsapp
          ? { raw: `Domande? <a href="https://wa.me/39${rec.business.whatsapp.replace(/\D/g, "")}">Scrivici su WhatsApp</a>.` }
          : "",
        { raw: `Imprevisto? <a href="${SITE_URL}/annulla/${encodeURIComponent(rec.id)}?t=${encodeURIComponent(rec.cancel_token)}">Annulla da qui</a> (fino a 2h prima).` },
      ].filter((l) => l !== "")),
    });
    sent++;
  }

  return Response.json({ checked: appointments?.length ?? 0, sent });
}
