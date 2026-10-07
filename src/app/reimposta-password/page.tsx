"use client";

/**
 * Destinazione del link di recupero: l'utente arriva già con la sessione
 * (/auth/callback ha scambiato il code) e imposta la nuova password.
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LanguageSwitcher } from "@/components/language-switcher";
import type { Lang } from "@/lib/i18n";
import { useLang } from "@/lib/i18n/use-lang";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const COPY: Record<
  Lang,
  {
    title: string;
    sub: string;
    label: string;
    ph: string;
    hide: string;
    show: string;
    saveError: string;
    saving: string;
    save: string;
  }
> = {
  it: {
    title: "Nuova password",
    sub: "Scegli la nuova password del tuo account.",
    label: "Nuova password",
    ph: "Minimo 8 caratteri",
    hide: "Nascondi password",
    show: "Mostra password",
    saveError:
      "Salvataggio non riuscito. Il link potrebbe essere scaduto — richiedine uno nuovo.",
    saving: "Salvataggio…",
    save: "Salva nuova password",
  },
  en: {
    title: "New password",
    sub: "Choose the new password for your account.",
    label: "New password",
    ph: "At least 8 characters",
    hide: "Hide password",
    show: "Show password",
    saveError:
      "Couldn't save. The link may have expired — request a new one.",
    saving: "Saving…",
    save: "Save new password",
  },
};

export default function ResetPasswordPage() {
  const lang = useLang();
  const t = COPY[lang];
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(t.saveError);
      return;
    }
    router.push("/app");
    router.refresh();
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
        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">{t.label}</span>
            <div className="flex items-center rounded-lg border border-zinc-300 focus-within:border-zinc-900">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg px-3 py-2 outline-none"
                placeholder={t.ph}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? t.hide : t.show}
                className="px-3 text-zinc-400 hover:text-zinc-700"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
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
            {loading ? t.saving : t.save}
          </button>
        </form>
      </div>
    </main>
  );
}
