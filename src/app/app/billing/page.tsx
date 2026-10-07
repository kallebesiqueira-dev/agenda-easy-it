import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getSubscriptionAccess, PLAN, TRIAL_DAYS } from "@/lib/billing";
import { getLang } from "@/lib/i18n/server";
import { formatEUR } from "@/lib/money";
import { getCurrentBusiness } from "@/lib/panel/current-business";
import { BillingPanel } from "./billing-panel";

export const metadata: Metadata = { title: "Abbonamento — Agenda Easy" };

export default async function BillingPage() {
  const ctx = await getCurrentBusiness();
  if (!ctx) redirect("/app/onboarding");
  const lang = await getLang();
  const t =
    lang === "en"
      ? {
          title: "Subscription",
          perMonth: "/month",
          bullets: [
            "✓ Full access, no limits",
            "✓ Online booking page",
            "✓ 50% deposit with slot hold",
            `✓ ${TRIAL_DAYS}-day free trial`,
          ],
          back: "← Back to the dashboard",
        }
      : {
          title: "Abbonamento",
          perMonth: "/mese",
          bullets: [
            "✓ Accesso completo, senza limiti",
            "✓ Pagina di prenotazione online",
            "✓ Acconto del 50% con blocco dell'orario",
            `✓ Prova gratuita di ${TRIAL_DAYS} giorni`,
          ],
          back: "← Torna al pannello",
        };

  const access = await getSubscriptionAccess(
    ctx.business.id,
    ctx.business.created_at,
    ctx.business.comped
  );

  return (
    <main className="flex min-h-dvh items-center justify-center bg-zinc-100 px-4 text-zinc-900">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-xl font-bold">{t.title}</h1>
            <LanguageSwitcher current={lang} />
          </div>
          <p className="mt-1 text-sm text-zinc-500">{ctx.business.name}</p>

          <div className="mt-4 rounded-xl border border-zinc-200 p-4">
            <p className="font-semibold">{PLAN.name}</p>
            <p className="mt-1 text-2xl font-bold">
              {formatEUR(PLAN.priceMinor)}
              <span className="text-sm font-normal text-zinc-500">
                {t.perMonth}
              </span>
            </p>
            <ul className="mt-2 space-y-1 text-sm text-zinc-600">
              {t.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>

          <BillingPanel
            status={access.status}
            allowed={access.allowed}
            trialDaysLeft={access.trialDaysLeft}
            hasStripeCustomer={Boolean(access.subscription?.stripe_customer_id)}
            lang={lang}
          />
        </div>

        {access.allowed && (
          <p className="mt-4 text-center text-sm">
            <Link href="/app" className="text-zinc-600 underline">
              {t.back}
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
