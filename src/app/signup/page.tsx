import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getLang } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return {
    title: lang === "en" ? "Create account — Agenda Easy" : "Crea account — Agenda Easy",
  };
}

export default async function SignupPage() {
  const lang = await getLang();
  const t =
    lang === "en"
      ? {
          title: "Create account",
          sub: "Start taking online bookings in minutes.",
          agree1: "By creating an account you accept the",
          terms: "Terms",
          privacyLead: "the",
          and: "and the ",
          privacy: "Privacy Policy",
          cookie: "Cookie Policy",
          hasAccount: "Already have an account?",
          signIn: "Sign in",
        }
      : {
          title: "Crea account",
          sub: "Inizia a ricevere prenotazioni online in pochi minuti.",
          agree1: "Creando l'account accetti i",
          terms: "Termini",
          privacyLead: "la",
          and: "e l'",
          privacy: "Privacy",
          cookie: "Informativa cookie",
          hasAccount: "Hai già un account?",
          signIn: "Accedi",
        };

  return (
    <AuthShell lang={lang}>
      <div className="mb-1 flex items-start justify-between gap-3">
        <h1>{t.title}</h1>
        <LanguageSwitcher current={lang} />
      </div>
      <p className="lede">{t.sub}</p>
      <AuthForm mode="signup" lang={lang} />
      <p className="mt-3 text-center text-xs text-zinc-400">
          {t.agree1}{" "}
          <Link href="/termini" className="underline">
            {t.terms}
          </Link>
          , {t.privacyLead}{" "}
          <Link href="/privacy" className="underline">
            {t.privacy}
          </Link>{" "}
          {t.and}
          <Link href="/cookie" className="underline">
            {t.cookie}
          </Link>
          .
      </p>
      <p className="mt-4 text-center text-sm text-zinc-500">
        {t.hasAccount}{" "}
        <Link href="/login" className="font-semibold text-zinc-900 underline decoration-[var(--tint)]/50 underline-offset-4 hover:decoration-[var(--tint)]">
          {t.signIn}
        </Link>
      </p>
    </AuthShell>
  );
}
