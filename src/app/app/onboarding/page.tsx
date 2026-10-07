import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getLang } from "@/lib/i18n/server";
import { getCurrentBusiness } from "@/lib/panel/current-business";
import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = { title: "Crea attività — Agenda Easy" };

export default async function OnboardingPage() {
  // Chi ha già un'attività non ripassa di qui
  const ctx = await getCurrentBusiness();
  if (ctx) redirect("/app");
  const lang = await getLang();
  const t =
    lang === "en"
      ? {
          title: "Create your business",
          sub: "This information appears on your booking page. You can change it later.",
        }
      : {
          title: "Crea la tua attività",
          sub: "Questi dati compaiono nella tua pagina di prenotazione. Potrai modificarli in seguito.",
        };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-zinc-100 px-4 text-zinc-900">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-xl font-bold">{t.title}</h1>
          <LanguageSwitcher current={lang} />
        </div>
        <p className="mb-4 mt-1 text-sm text-zinc-500">{t.sub}</p>
        <OnboardingForm lang={lang} />
      </div>
    </main>
  );
}
