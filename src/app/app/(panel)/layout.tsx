import Link from "next/link";
import { redirect } from "next/navigation";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getSubscriptionAccess } from "@/lib/billing";
import type { Lang } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { getCurrentBusiness } from "@/lib/panel/current-business";
import { SupportChat } from "@/components/support-chat";
import { IconAlert, IconExternal, IconLock, IconSparkle } from "@/components/icons";
import { Reveal } from "@/components/reveal";
import { PanelNav } from "./panel-nav";
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
      { href: "/app/plans", label: "Piani" },
      { href: "/app/professionals", label: "Team" },
      { href: "/app/hours", label: "Orari" },
      { href: "/app/report", label: "Report" },
      { href: "/app/settings", label: "Impostazioni" },
    ],
    notPublished: " · non pubblicata",
    lockedBanner: [
      "La tua pagina ",
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
      { href: "/app/plans", label: "Plans" },
      { href: "/app/professionals", label: "Team" },
      { href: "/app/hours", label: "Hours" },
      { href: "/app/report", label: "Reports" },
      { href: "/app/settings", label: "Settings" },
    ],
    notPublished: " · not published",
    lockedBanner: [
      "Your page ",
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

  const initial = ctx.business.name.trim().charAt(0).toUpperCase() || "A";

  const brand = (
    <Link href="/app" className="flex items-center gap-2.5 rounded-xl">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-700 font-[family-name:var(--font-display)] text-lg font-semibold text-[#f6f1e7] shadow-[inset_0_-2px_0_rgb(0_0_0/0.18)]">
        {initial}
      </span>
      <span className="min-w-0">
        <span className="block truncate font-[family-name:var(--font-display)] text-[1.05rem] leading-tight font-semibold">
          {ctx.business.name}
        </span>
        <span className="block text-[0.7rem] tracking-[0.14em] text-zinc-500 uppercase">
          agenda<span className="text-[#e4572e]">easy</span>
        </span>
      </span>
    </Link>
  );

  const pageLink = (
    <Link
      href={`/${ctx.business.slug}`}
      target="_blank"
      className="group flex items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white/60 px-3 text-sm text-zinc-600 transition-colors hover:border-zinc-300 hover:text-zinc-900"
    >
      <span className="flex min-w-0 items-center gap-2">
        <span
          className={`size-2 shrink-0 rounded-full ${ctx.business.published ? "bg-emerald-500 shadow-[0_0_0_3px_rgb(47_125_94/0.18)]" : "bg-zinc-300"}`}
        />
        <span className="truncate font-[family-name:var(--font-mono)] text-xs">
          /{ctx.business.slug}
          {!ctx.business.published && t.notPublished}
        </span>
      </span>
      <IconExternal size={15} className="shrink-0 text-zinc-400 group-hover:text-zinc-700" />
    </Link>
  );

  return (
    <div className="ui-panel min-h-dvh bg-[#f6f1e7] text-zinc-900">
      <div className="mx-auto flex w-full max-w-6xl">
        {/* Barra laterale (desktop) */}
        <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-6 border-r border-zinc-900/[0.06] px-4 py-6 lg:flex">
          {brand}
          <PanelNav items={t.nav} variant="side" />
          <div className="mt-auto space-y-3">
            {pageLink}
            <div className="flex items-center justify-between">
              <LanguageSwitcher current={lang} />
              <SignOutButton />
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {/* Intestazione (mobile/tablet) */}
          <header className="sticky top-0 z-30 border-b border-zinc-900/[0.06] bg-[#f6f1e7]/85 px-4 pt-3 backdrop-blur-md lg:hidden">
            <div className="mb-3 flex items-center justify-between gap-3">
              {brand}
              <div className="flex items-center gap-1">
                <LanguageSwitcher current={lang} />
                <SignOutButton />
              </div>
            </div>
            <PanelNav items={t.nav} variant="top" />
          </header>

          <div className="space-y-2 px-4 pt-4 lg:px-10 lg:pt-8">
            <div className="lg:hidden">{pageLink}</div>
            {!ctx.business.published && (
              <p className="flex items-start gap-3 rounded-2xl border border-sky-900/10 bg-sky-50 px-4 py-3 text-sm text-sky-900">
                <IconLock size={18} className="mt-0.5 shrink-0" />
                <span>
                  {t.lockedBanner[0]}
                  <strong>{t.lockedBanner[1]}</strong>
                  {t.lockedBanner[2]}
                  <Link href="/app/settings" className="font-semibold underline decoration-sky-900/30 underline-offset-4 hover:decoration-sky-900">
                    {t.lockedBanner[3]}
                  </Link>
                  .
                </span>
              </p>
            )}
            {access.status === "trialing" && (
              <p className="flex items-center gap-3 rounded-2xl border border-[#e4572e]/15 bg-[#fdeee7] px-4 py-3 text-sm text-[#7a2d17]">
                <IconSparkle size={18} className="shrink-0 text-[#e4572e]" />
                <span>
                  {t.trial(access.trialDaysLeft)}
                  <Link href="/app/billing" className="font-semibold underline decoration-[#e4572e]/40 underline-offset-4 hover:decoration-[#e4572e]">
                    {t.subscribeNow}
                  </Link>
                </span>
              </p>
            )}
            {access.status === "past_due" && (
              <p className="flex items-center gap-3 rounded-2xl border border-red-700/15 bg-red-50 px-4 py-3 text-sm text-red-700">
                <IconAlert size={18} className="shrink-0" />
                <span>
                  {t.pastDue}
                  <Link href="/app/billing" className="font-semibold underline underline-offset-4">
                    {t.payNow}
                  </Link>
                </span>
              </p>
            )}
          </div>

          <main className="mx-auto w-full max-w-3xl px-4 py-6 lg:mx-0 lg:px-10 lg:pb-16">
            <Reveal>{children}</Reveal>
          </main>
        </div>
      </div>
      <SupportChat />
    </div>
  );
}
