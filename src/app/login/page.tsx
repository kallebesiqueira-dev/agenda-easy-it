import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getLang } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Accedi — Agenda Easy" };

export default async function LoginPage() {
  const lang = await getLang();
  const t =
    lang === "en"
      ? {
          title: "Sign in",
          sub: "Access your business dashboard.",
          noAccount: "Don't have an account yet?",
          signUp: "Create account",
        }
      : {
          title: "Accedi",
          sub: "Entra nel pannello della tua attività.",
          noAccount: "Non hai ancora un account?",
          signUp: "Crea account",
        };

  return (
    <main className="flex ui-panel ui-grain relative min-h-dvh flex-col items-center justify-center px-4 py-10 text-zinc-900">
      <Link href="/" className="mb-6 rounded-lg font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
        agenda<span className="text-emerald-700">easy</span>
        <span className="text-[var(--tint)]">.</span>
      </Link>
      <div className="w-full max-w-sm rounded-3xl border border-zinc-900/[0.06] bg-card p-6 shadow-lg sm:p-8">
        <div className="flex items-start justify-between gap-2">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold">{t.title}</h1>
          <LanguageSwitcher current={lang} />
        </div>
        <p className="mb-4 mt-1 text-sm text-zinc-500">{t.sub}</p>
        <AuthForm mode="login" lang={lang} />
        <p className="mt-4 text-center text-sm text-zinc-500">
          {t.noAccount}{" "}
          <Link href="/signup" className="font-semibold text-zinc-900 underline decoration-[var(--tint)]/50 underline-offset-4 hover:decoration-[var(--tint)]">
            {t.signUp}
          </Link>
        </p>
      </div>
    </main>
  );
}
