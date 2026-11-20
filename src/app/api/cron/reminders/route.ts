/**
 * GET /api/cron/reminders — promemoria e reconquista via e-mail (Resend).
 *
 * Tre passaggi idempotenti a ogni esecuzione:
 *  1. Promemoria ~24h prima (flag `reminded_at`).
 *  2. Promemoria "a breve" ~2h prima (flag `reminded_2h_at`).
 *  3. Win-back: clienti che non tornano da ~15 giorni (flag `winback_sent_at`).
 *
 * I promemoria a 2h presuppongono un'esecuzione ORARIA del cron: su Vercel
 * Hobby il cron è giornaliero, quindi un pinger esterno (GitHub Actions) chiama
 * questo endpoint ogni ora. Tutti i passaggi sono idempotenti: eseguirlo più
 * spesso non manda doppioni.
 *
 * Protezione: header Authorization: Bearer CRON_SECRET (fail-closed senza secret).
 */

import { formatDateTimeInTz } from "@/lib/dates";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { emailLayout, escapeHtml, sendEmail } from "@/lib/notifications";

type Admin = ReturnType<typeof createSupabaseAdminClient>;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://agendaeasy.it";
const H = 60 * 60 * 1000;

interface ApptRec {
  id: string;
  starts_at: string;
  cancel_token: string;
  customer_email: string | null;
  lang: "it" | "en" | null;
  customer: { name: string } | null;
  service: { name: string } | null;
  business: { name: string; timezone: string; address: string | null; whatsapp: string | null } | null;
}

const waLink = (whatsapp: string | null) =>
  whatsapp ? `https://wa.me/39${whatsapp.replace(/\D/g, "")}` : null;

/** Passaggio promemoria (24h o 2h): stessa struttura, testo diverso. */
async function sendReminders(
  supabase: Admin,
  variant: "24h" | "2h",
  fromMs: number,
  toMs: number
): Promise<number> {
  const col = variant === "24h" ? "reminded_at" : "reminded_2h_at";
  const { data, error } = await supabase
    .from("appointments")
    .select(
      `id, starts_at, cancel_token, customer_email, lang,
       customer:customers(name), service:services(name),
       business:businesses(name, timezone, address, whatsapp)`
    )
    .eq("status", "confirmed")
    .is(col, null)
    .gte("starts_at", new Date(fromMs).toISOString())
    .lt("starts_at", new Date(toMs).toISOString());

  if (error) {
    console.error(`cron ${variant} query error`, error);
    return 0;
  }

  let sent = 0;
  for (const row of (data ?? []) as unknown as ApptRec[]) {
    if (!row.customer_email || !row.business) continue;
    const lang = row.lang === "en" ? "en" : "it";

    // Marca PRIMA di inviare: se cade a metà non rimanda spam alla prossima
    // esecuzione (perdere 1 promemoria è meglio che duplicarlo).
    await supabase.from("appointments").update({ [col]: new Date().toISOString() }).eq("id", row.id);

    const when = formatDateTimeInTz(row.starts_at, row.business.timezone, lang);
    const wa = waLink(row.business.whatsapp);
    const cancelUrl = `${SITE_URL}/annulla/${encodeURIComponent(row.id)}?t=${encodeURIComponent(row.cancel_token)}`;
    const soon = variant === "2h";
    const svc = escapeHtml(row.service?.name ?? "");
    const biz = escapeHtml(row.business.name);

    const subject =
      lang === "en"
        ? `${soon ? "Soon" : "Reminder"}: ${row.service?.name ?? "your appointment"} — ${row.business.name}`
        : `${soon ? "A breve" : "Promemoria"}: ${row.service?.name ?? "il tuo appuntamento"} — ${row.business.name}`;
    const title =
      lang === "en"
        ? `Hi, ${row.customer?.name ?? ""}! ${soon ? "Your appointment is in a couple of hours" : "Your appointment is coming up"}`
        : `Ciao, ${row.customer?.name ?? ""}! ${soon ? "Il tuo appuntamento è tra poche ore" : "Il tuo appuntamento si avvicina"}`;
    const lead =
      lang === "en"
        ? { raw: `Your <strong>${svc}</strong> appointment at <strong>${biz}</strong> is <strong>${when}</strong>.` }
        : { raw: `Il tuo appuntamento di <strong>${svc}</strong> presso <strong>${biz}</strong> è <strong>${when}</strong>.` };
    const lines =
      lang === "en"
        ? [
            lead,
            row.business.address ? `Address: ${row.business.address}` : "",
            wa ? { raw: `Questions? <a href="${wa}">Message us on WhatsApp</a>.` } : "",
            { raw: `Change of plans? <a href="${cancelUrl}">Cancel here</a> (up to 2h before).` },
          ]
        : [
            lead,
            row.business.address ? `Indirizzo: ${row.business.address}` : "",
            wa ? { raw: `Domande? <a href="${wa}">Scrivici su WhatsApp</a>.` } : "",
            { raw: `Imprevisto? <a href="${cancelUrl}">Annulla da qui</a> (fino a 2h prima).` },
          ];

    await sendEmail({ to: row.customer_email, subject, html: emailLayout(title, lines.filter((l) => l !== ""), lang) });
    sent++;
  }
  return sent;
}

interface WinbackRow {
  id: string;
  business_id: string;
  name: string;
  email: string;
  business_name: string;
  whatsapp: string | null;
  slug: string;
  lang: "it" | "en" | null;
}

/** Passaggio win-back: "ci manchi, prenotiamo?" a chi non torna da ~15 giorni. */
async function sendWinback(supabase: Admin): Promise<number> {
  const { data, error } = await supabase.rpc("customers_for_winback", { p_gap_days: 15, p_max_days: 45 });
  if (error) {
    console.error("cron winback query error", error);
    return 0;
  }

  let sent = 0;
  for (const c of (data ?? []) as WinbackRow[]) {
    if (!c.email) continue;
    const lang = c.lang === "en" ? "en" : "it";

    await supabase.from("customers").update({ winback_sent_at: new Date().toISOString() }).eq("id", c.id);

    const wa = waLink(c.whatsapp);
    const bookUrl = `${SITE_URL}/${c.slug}`;
    const biz = escapeHtml(c.business_name);

    const subject =
      lang === "en" ? `We miss you! Book when you like — ${c.business_name}` : `Ci manchi! Prenota quando vuoi — ${c.business_name}`;
    const title =
      lang === "en" ? `Hi ${c.name}, it's been a while 💜` : `Ciao ${c.name}, è passato un po' 💜`;
    const lines =
      lang === "en"
        ? [
            { raw: `We haven't seen you at <strong>${biz}</strong> for a while — we miss you!` },
            { raw: `Book your next appointment whenever you like: <a href="${bookUrl}">${bookUrl}</a>` },
            wa ? { raw: `Or message us on <a href="${wa}">WhatsApp</a>.` } : "",
          ]
        : [
            { raw: `Non ti vediamo da un po' da <strong>${biz}</strong> — ci manchi!` },
            { raw: `Prenota il tuo prossimo appuntamento quando vuoi: <a href="${bookUrl}">${bookUrl}</a>` },
            wa ? { raw: `Oppure scrivici su <a href="${wa}">WhatsApp</a>.` } : "",
          ];

    await sendEmail({ to: c.email, subject, html: emailLayout(title, lines.filter((l) => l !== ""), lang) });
    sent++;
  }
  return sent;
}

export async function GET(request: Request) {
  // Fail-closed: senza CRON_SECRET configurato, nessuno esegue.
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const now = Date.now();

  // Finestre larghe: con dedup per-flag tollerano ritardi/salti del cron orario.
  const reminders24h = await sendReminders(supabase, "24h", now + 22 * H, now + 26 * H);
  const reminders2h = await sendReminders(supabase, "2h", now + 1 * H, now + 3 * H);
  const winback = await sendWinback(supabase);

  return Response.json({ reminders24h, reminders2h, winback });
}
