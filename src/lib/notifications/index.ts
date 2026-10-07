/**
 * E-mails transacionais via Resend (REST puro, sem SDK).
 * Sem RESEND_API_KEY configurada, tudo vira no-op silencioso — o fluxo de
 * reserva nunca falha por causa de notificação.
 */

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const FROM = () =>
  process.env.EMAIL_FROM ?? "Agenda Easy <onboarding@resend.dev>";

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM(),
        to: [input.to],
        subject: input.subject,
        html: input.html,
      }),
    });
    if (!res.ok) console.error("sendEmail failed", res.status, await res.text());
  } catch (err) {
    console.error("sendEmail error", err);
  }
}

/** E-mail do dono (owner) do negócio, via admin API. */
export async function getOwnerEmail(businessId: string): Promise<string | null> {
  const supabase = createSupabaseAdminClient();
  const { data: member } = await supabase
    .from("business_members")
    .select("user_id")
    .eq("business_id", businessId)
    .eq("role", "owner")
    .limit(1)
    .maybeSingle();
  if (!member) return null;
  const { data } = await supabase.auth.admin.getUserById(member.user_id);
  return data.user?.email ?? null;
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Linha de e-mail: string é escapada; HTML intencional entra via { raw }
 * (o chamador é responsável por escapar as interpolações do raw).
 */
export type EmailLine = string | { raw: string };

/** Layout mínimo e seguro para os e-mails transacionais. */
export function emailLayout(title: string, lines: EmailLine[]): string {
  return `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#18181b">
    <h2 style="margin:24px 0 12px">${esc(title)}</h2>
    ${lines
      .map(
        (l) =>
          `<p style="margin:6px 0;line-height:1.5">${typeof l === "string" ? esc(l) : l.raw}</p>`
      )
      .join("")}
    <p style="margin-top:24px;font-size:12px;color:#a1a1aa">Agenda Easy — agendamento online</p>
  </div>`;
}

export { esc as escapeHtml };
