"use client";

import { useState } from "react";
import Link from "next/link";
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
    <main className="flex min-h-dvh flex-col items-center justify-center bg-zinc-100 px-4 text-zinc-900">
      <Link href="/" className="mb-4 text-xl font-bold tracking-tight">
        agenda<span className="italic text-emerald-900">easy</span>
        <span className="text-orange-600">.</span>
      </Link>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-xl font-bold">{t.title}</h1>
          <LanguageSwitcher current={lang} />
        </div>
        <p className="mb-4 mt-1 text-sm text-zinc-500">{t.sub}</p>

        {sent ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
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
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                placeholder={t.emailPh}
              />
            </label>
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-zinc-900 py-3 font-semibold text-white disabled:opacity-60"
            >
              {loading ? t.sending : t.send}
            </button>
          </form>
        )}

        <p className="mt-4 text-center text-sm text-zinc-500">
          <Link href="/login" className="font-medium text-zinc-900 underline">
            {t.back}
          </Link>
        </p>
      </div>
    </main>
  );
}
