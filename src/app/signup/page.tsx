import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getLang } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Crea account — Agenda Easy" };

export default async function SignupPage() {
  const lang = await getLang();
  const t =
    lang === "en"
      ? {
          title: "Create account",
          sub: "Start taking online bookings in minutes.",
          agree1: "By creating an account you accept the",
          terms: "Terms",
          and: "and the",
          privacy: "Privacy Policy",
          hasAccount: "Already have an account?",
          signIn: "Sign in",
        }
      : {
          title: "Crea account",
          sub: "Inizia a ricevere prenotazioni online in pochi minuti.",
          agree1: "Creando l'account accetti i",
          terms: "Termini",
          and: "e la",
          privacy: "Privacy",
          hasAccount: "Hai già un account?",
          signIn: "Accedi",
        };

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
        <AuthForm mode="signup" lang={lang} />
        <p className="mt-3 text-center text-xs text-zinc-400">
          {t.agree1}{" "}
          <Link href="/termini" className="underline">
            {t.terms}
          </Link>{" "}
          {t.and}{" "}
          <Link href="/privacy" className="underline">
            {t.privacy}
          </Link>
          .
        </p>
        <p className="mt-4 text-center text-sm text-zinc-500">
          {t.hasAccount}{" "}
          <Link href="/login" className="font-semibold text-zinc-900 underline decoration-[var(--tint)]/50 underline-offset-4 hover:decoration-[var(--tint)]">
            {t.signIn}
          </Link>
        </p>
      </div>
    </main>
  );
}
