"use client";

/**
 * Destinazione del link di recupero: l'utente arriva già con la sessione
 * (/auth/callback ha scambiato il code) e imposta la nuova password.
 */

import { IconEye, IconEyeOff } from "@/components/icons";
import { useState } from "react";
import { useRouter } from "next/navigation";
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
    <AuthShell lang={lang}>
        <div className="mb-1 flex items-start justify-between gap-3">
          <h1>{t.title}</h1>
          <LanguageSwitcher current={lang} />
        </div>
        <p className="lede">{t.sub}</p>
        <form onSubmit={onSubmit} className="space-y-3">
          <label className={`auth-field relative block ${error ? "is-invalid" : ""}`}>
            <span className="mb-1 block text-sm font-medium">{t.label}</span>
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={error ? true : undefined}
              className="min-h-12 w-full rounded-[14px] pr-12 pl-4"
              placeholder={t.ph}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? t.hide : t.show}
              className="absolute right-1 bottom-1 grid min-h-11 min-w-11 place-items-center text-zinc-400 transition-colors hover:text-zinc-700"
            >
              {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
            </button>
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
            {loading ? t.saving : t.save}
          </button>
        </form>
    </AuthShell>
  );
}
