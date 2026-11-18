"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { LanguageSwitcher } from "@/components/language-switcher";
import type { Lang } from "@/lib/i18n";
import { useLang } from "@/lib/i18n/use-lang";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const COPY: Record<
  Lang,
  {
    title: string;
    sub: string;
    sent: string;
    email: string;
    emailPh: string;
    sendError: string;
    sending: string;
    send: string;
    back: string;
  }
> = {
  it: {
    title: "Recupera password",
    sub: "Ti invieremo un link per creare una nuova password.",
    sent:
      "Se esiste un account con questa e-mail, il link è stato inviato. Controlla anche la cartella spam.",
    email: "E-mail",
    emailPh: "tu@esempio.com",
    sendError: "Invio non riuscito. Controlla l'e-mail e riprova.",
    sending: "Invio in corso…",
    send: "Invia link",
    back: "Torna all'accesso",
  },
  en: {
    title: "Recover password",
    sub: "We'll send you a link to create a new password.",
    sent:
      "If an account exists for this e-mail, the link has been sent. Check your spam folder too.",
    email: "E-mail",
    emailPh: "you@example.com",
    sendError: "Couldn't send the link. Check the e-mail and try again.",
    sending: "Sending…",
    send: "Send link",
    back: "Back to sign in",
  },
};

export default function ForgotPasswordPage() {
  const lang = useLang();
  const t = COPY[lang];
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reimposta-password`,
    });
    setLoading(false);
    if (error) {
      setError(t.sendError);
      return;
    }
    setSent(true);
  }

  return (
    <AuthShell lang={lang}>
        <div className="mb-1 flex items-start justify-between gap-3">
          <h1>{t.title}</h1>
          <LanguageSwitcher current={lang} />
        </div>
        <p className="lede">{t.sub}</p>

        {sent ? (
          <p className="rounded-lg bg-[var(--green-bg)] px-3 py-2 text-sm text-[var(--green)]">
            {t.sent}
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">{t.email}</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={error ? true : undefined}
                className={`auth-field min-h-12 w-full rounded-[14px] px-4 ${error ? "is-invalid" : ""}`}
                placeholder={t.emailPh}
              />
            </label>
            {error && (
              <p role="alert" className="auth-alert rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="ui-press min-h-12 w-full rounded-full bg-tint py-3 font-semibold text-white disabled:opacity-60"
            >
              {loading ? t.sending : t.send}
            </button>
          </form>
        )}

        <p className="mt-4 text-center text-sm text-zinc-500">
          <Link href="/login" className="font-semibold text-zinc-900 underline decoration-[var(--tint)]/50 underline-offset-4 hover:decoration-[var(--tint)]">
            {t.back}
          </Link>
        </p>
    </AuthShell>
  );
}
