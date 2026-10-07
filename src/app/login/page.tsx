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
        <AuthForm mode="login" lang={lang} />
        <p className="mt-4 text-center text-sm text-zinc-500">
          {t.noAccount}{" "}
          <Link href="/signup" className="font-medium text-zinc-900 underline">
            {t.signUp}
          </Link>
        </p>
      </div>
    </main>
  );
}
