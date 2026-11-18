import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { DemoButton } from "@/components/demo-button";
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
          demo: "Try the demo",
          demoPending: "Opening the demo…",
          demoError: "The demo isn't available in this environment yet.",
        }
      : {
          title: "Accedi",
          sub: "Entra nel pannello della tua attività.",
          noAccount: "Non hai ancora un account?",
          signUp: "Crea account",
          demo: "Prova la demo",
          demoPending: "Apro la demo…",
          demoError: "La demo non è ancora disponibile in questo ambiente.",
        };

  return (
    <AuthShell lang={lang}>
      <div className="mb-1 flex items-start justify-between gap-3">
        <h1>{t.title}</h1>
        <LanguageSwitcher current={lang} />
      </div>
      <p className="lede">{t.sub}</p>
      <AuthForm mode="login" lang={lang} />
      <DemoButton
        label={t.demo}
        pendingLabel={t.demoPending}
        errorLabel={t.demoError}
        full
        className="ui-press mt-3 flex min-h-12 w-full items-center justify-center rounded-full border border-[var(--border)] bg-white text-[15px] font-semibold text-[var(--label)] hover:bg-[var(--fill)] disabled:opacity-60"
      />
      <p className="mt-4 text-center text-sm text-zinc-500">
        {t.noAccount}{" "}
        <Link href="/signup" className="font-semibold text-zinc-900 underline decoration-[var(--tint)]/50 underline-offset-4 hover:decoration-[var(--tint)]">
          {t.signUp}
        </Link>
      </p>
    </AuthShell>
  );
}
