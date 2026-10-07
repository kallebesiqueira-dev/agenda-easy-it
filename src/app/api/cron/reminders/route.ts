/**
 * GET /api/cron/reminders — roda 1× por dia às 11:00 UTC (08:00 BRT; plano
 * Hobby da Vercel só permite cron diário). Lembra por e-mail os clientes com
 * horário confirmado nas próximas 26h que ainda não foram lembrados
 * (reminded_at garante idempotência).
 * Proteção: header Authorization: Bearer CRON_SECRET (Vercel envia sozinho).
 */

import { formatDateTimeInTz } from "@/lib/dates";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { emailLayout, escapeHtml, sendEmail } from "@/lib/notifications";

export async function GET(request: Request) {
  // Fail-closed: sem CRON_SECRET configurado, ninguém executa.
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const now = Date.now();
  // Janela 1h–27h: cobre manhã cedo em UTC-3 e dá folga a atrasos do cron.
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

    // Marca ANTES de enviar: se o processo cair no meio, não reenvia spam
    // na próxima execução (perder 1 lembrete é melhor que duplicar).
    await supabase
      .from("appointments")
      .update({ reminded_at: new Date().toISOString() })
      .eq("id", rec.id);

    const when = formatDateTimeInTz(rec.starts_at, rec.business.timezone);
    await sendEmail({
      to: rec.customer_email,
      subject: `Lembrete: ${rec.service?.name ?? "seu horário"} — ${rec.business.name}`,
      html: emailLayout(`Olá, ${rec.customer?.name ?? ""}! Seu horário está chegando`, [
        { raw: `Seu horário de <strong>${escapeHtml(rec.service?.name ?? "")}</strong> em <strong>${escapeHtml(rec.business.name)}</strong> é <strong>${when}</strong>.` },
        rec.business.address ? `Endereço: ${rec.business.address}` : "",
        rec.business.whatsapp
          ? { raw: `Dúvidas? <a href="https://wa.me/55${rec.business.whatsapp.replace(/\D/g, "")}">Chame no WhatsApp</a>.` }
          : "",
        { raw: `Imprevisto? <a href="https://agenda-easy.vercel.app/cancelar/${encodeURIComponent(rec.id)}?t=${encodeURIComponent(rec.cancel_token)}">Cancele por aqui</a> (até 2h antes).` },
      ].filter((l) => l !== "")),
    });
    sent++;
  }

  return Response.json({ checked: appointments?.length ?? 0, sent });
}
