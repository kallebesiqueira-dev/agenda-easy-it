import Link from "next/link";
import { redirect } from "next/navigation";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getSubscriptionAccess } from "@/lib/billing";
import type { Lang } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { getCurrentBusiness } from "@/lib/panel/current-business";
import { SupportChat } from "@/components/support-chat";
import { SignOutButton } from "./sign-out-button";

const COPY: Record<
  Lang,
  {
    nav: { href: string; label: string }[];
    notPublished: string;
    lockedBanner: [string, string, string, string];
    trial: (days: number | null) => string;
    subscribeNow: string;
    pastDue: string;
    payNow: string;
  }
> = {
  it: {
    nav: [
      { href: "/app", label: "Agenda" },
      { href: "/app/services", label: "Servizi" },
      { href: "/app/professionals", label: "Team" },
      { href: "/app/hours", label: "Orari" },
      { href: "/app/report", label: "Report" },
      { href: "/app/settings", label: "Impostazioni" },
    ],
    notPublished: " · non pubblicata",
    lockedBanner: [
      "🔒 La tua pagina ",
      "non è ancora pubblica",
      " — i clienti non possono prenotare. Quando hai finito di inserire servizi, team e orari, ",
      "pubblicala dalle Impostazioni",
    ],
    trial: (days) => `Prova gratuita: ${days} giorno/i rimanente/i. `,
    subscribeNow: "Abbonati ora",
    pastDue: "Fattura scaduta — l'accesso verrà bloccato a breve. ",
    payNow: "Paga ora",
  },
  en: {
    nav: [
      { href: "/app", label: "Agenda" },
      { href: "/app/services", label: "Services" },
      { href: "/app/professionals", label: "Team" },
      { href: "/app/hours", label: "Hours" },
      { href: "/app/report", label: "Reports" },
      { href: "/app/settings", label: "Settings" },
    ],
    notPublished: " · not published",
    lockedBanner: [
      "🔒 Your page ",
      "isn't public yet",
      " — clients can't book. Once you've added services, team and hours, ",
      "publish it from Settings",
    ],
    trial: (days) => `Free trial: ${days} day(s) left. `,
    subscribeNow: "Subscribe now",
    pastDue: "Invoice overdue — access will be blocked soon. ",
    payNow: "Pay now",
  },
};

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getCurrentBusiness();
  if (!ctx) redirect("/app/onboarding");
  const lang = await getLang();
  const t = COPY[lang];

  const access = await getSubscriptionAccess(
    ctx.business.id,
    ctx.business.created_at,
    ctx.business.comped
  );
  if (!access.allowed) redirect("/app/billing");

  return (
    <div className="min-h-dvh bg-zinc-100 text-zinc-900">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-3">
          <div>
            <h1 className="font-bold">{ctx.business.name}</h1>
            <Link
              href={`/${ctx.business.slug}`}
              className="text-xs text-zinc-500 underline"
              target="_blank"
            >
              /{ctx.business.slug}
              {!ctx.business.published && t.notPublished}
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher current={lang} />
            <SignOutButton />
          </div>
        </div>
        <nav className="mx-auto flex w-full max-w-3xl flex-wrap gap-1 px-4 pb-2">
          {t.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      {!ctx.business.published && (
        <div className="bg-sky-50 text-sky-900">
          <p className="mx-auto w-full max-w-3xl px-4 py-2 text-sm">
            {t.lockedBanner[0]}
            <strong>{t.lockedBanner[1]}</strong>
            {t.lockedBanner[2]}
            <Link href="/app/settings" className="font-medium underline">
              {t.lockedBanner[3]}
            </Link>
            .
          </p>
        </div>
      )}
      {access.status === "trialing" && (
        <div className="bg-amber-50 text-amber-800">
          <p className="mx-auto w-full max-w-3xl px-4 py-2 text-sm">
            {t.trial(access.trialDaysLeft)}
            <Link href="/app/billing" className="font-medium underline">
              {t.subscribeNow}
            </Link>
          </p>
        </div>
      )}
      {access.status === "past_due" && (
        <div className="bg-red-50 text-red-700">
          <p className="mx-auto w-full max-w-3xl px-4 py-2 text-sm">
            {t.pastDue}
            <Link href="/app/billing" className="font-medium underline">
              {t.payNow}
            </Link>
          </p>
        </div>
      )}
      <main className="mx-auto w-full max-w-3xl px-4 py-6">{children}</main>
      <SupportChat />
    </div>
  );
}
