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
import { NavBar, Sidebar, TabBar } from "./panel-nav";
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
    more: string;
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
    more: "Altro",
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
    more: "More",
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
    <Link href="/app" className="flex items-center gap-3 rounded-[12px]">
      <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-tint text-[17px] font-semibold text-white">
        {initial}
      </span>
      <span className="min-w-0">
        <span className="ios-headline block truncate">{ctx.business.name}</span>
        <span className="ios-caption block text-[var(--label-2)]">Agenda Easy</span>
      </span>
    </Link>
  );

  const pageLink = (
    <Link
      href={`/${ctx.business.slug}`}
      target="_blank"
      className="ios-row group justify-between rounded-[12px] bg-[var(--card)] text-[15px]"
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <span
          className={`size-2 shrink-0 rounded-full ${ctx.business.published ? "bg-[var(--green)]" : "bg-[var(--label-3)]"}`}
        />
        <span className="truncate text-[var(--label-2)]">
          /{ctx.business.slug}
          {!ctx.business.published && t.notPublished}
        </span>
      </span>
      <IconExternal size={16} className="shrink-0 text-[var(--tint)]" />
    </Link>
  );

  const banner = "ios-subhead flex items-start gap-3 rounded-[16px] px-4 py-3";

  return (
    <div className="ui-panel min-h-dvh bg-[var(--bg)] text-[var(--label)]">
      <div className="flex w-full">
        {/* Sidebar iPadOS (desktop) */}
        <aside className="sticky top-0 hidden h-dvh w-[300px] shrink-0 flex-col gap-6 bg-[var(--card-2)] px-4 pt-6 pb-5 lg:flex [box-shadow:inset_-0.5px_0_0_var(--separator)]">
          <div className="px-2">{brand}</div>
          <Sidebar items={t.nav} />
          <div className="mt-auto space-y-3">
            {pageLink}
            <div className="flex items-center justify-between px-1">
              <LanguageSwitcher current={lang} />
              <SignOutButton />
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1 pb-28 lg:pb-0">
          <NavBar>
            <div className="lg:hidden">{brand}</div>
          </NavBar>
          <div className="flex items-center justify-end gap-1 px-4 lg:hidden">
            <LanguageSwitcher current={lang} />
            <SignOutButton />
          </div>

          <div className="mx-auto w-full max-w-3xl space-y-2 px-4 pt-2 lg:px-10">
            <div className="lg:hidden">{pageLink}</div>
            {!ctx.business.published && (
              <p className={`${banner} bg-[var(--card)] text-[var(--label)]`}>
                <IconLock size={18} className="mt-0.5 shrink-0 text-[var(--tint)]" />
                <span>
                  {t.lockedBanner[0]}
                  <strong>{t.lockedBanner[1]}</strong>
                  {t.lockedBanner[2]}
                  <Link href="/app/settings" className="font-semibold text-[var(--tint)]">
                    {t.lockedBanner[3]}
                  </Link>
                  .
                </span>
              </p>
            )}
            {access.status === "trialing" && (
              <p className={`${banner} bg-[var(--tint-soft)] text-[var(--label)]`}>
                <IconSparkle size={18} className="mt-0.5 shrink-0 text-[var(--tint)]" />
                <span>
                  {t.trial(access.trialDaysLeft)}
                  <Link href="/app/billing" className="font-semibold text-[var(--tint)]">
                    {t.subscribeNow}
                  </Link>
                </span>
              </p>
            )}
            {access.status === "past_due" && (
              <p className={`${banner} bg-red-50 text-[var(--red)]`}>
                <IconAlert size={18} className="mt-0.5 shrink-0" />
                <span>
                  {t.pastDue}
                  <Link href="/app/billing" className="font-semibold underline underline-offset-4">
                    {t.payNow}
                  </Link>
                </span>
              </p>
            )}
          </div>

          <main className="mx-auto w-full max-w-3xl px-4 pt-4 pb-10 lg:px-10 lg:pb-16">
            <Reveal>{children}</Reveal>
          </main>
        </div>
      </div>
      <TabBar items={t.nav} moreLabel={t.more} />
      <SupportChat />
    </div>
  );
}
