"use client";

/**
 * Destinazione del link di recupero: l'utente arriva già con la sessione
 * (/auth/callback ha scambiato il code) e imposta la nuova password.
 */

import { IconEye, IconEyeOff } from "@/components/icons";
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
    <main className="flex ui-panel ui-grain relative min-h-dvh flex-col items-center justify-center bg-[var(--bg)] px-4 py-10 text-zinc-900">
      <Link href="/" className="mb-6 rounded-lg font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
        agenda<span className="italic text-emerald-700">easy</span>
        <span className="text-[var(--tint)]">.</span>
      </Link>
      <div className="w-full max-w-sm rounded-3xl border border-zinc-900/[0.06] bg-card p-6 shadow-lg sm:p-8">
        <div className="flex items-start justify-between gap-2">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold">{t.title}</h1>
          <LanguageSwitcher current={lang} />
        </div>
        <p className="mb-4 mt-1 text-sm text-zinc-500">{t.sub}</p>
        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">{t.label}</span>
            <div className="flex items-center rounded-lg border border-zinc-200 focus-within:border-zinc-900 hover:border-zinc-300">
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
                className="grid min-h-11 min-w-11 place-items-center text-zinc-400 transition-colors hover:text-zinc-700"
              >
                {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
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
            className="w-full rounded-full bg-tint py-3 font-semibold text-white disabled:opacity-60 ui-press hover:bg-emerald-700"
          >
            {loading ? t.saving : t.save}
          </button>
        </form>
      </div>
    </main>
  );
}
