import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSubscriptionAccess, PLAN, TRIAL_DAYS } from "@/lib/billing";
import { formatEUR } from "@/lib/money";
import { getCurrentBusiness } from "@/lib/panel/current-business";
import { BillingPanel } from "./billing-panel";

export const metadata: Metadata = { title: "Abbonamento — Agenda Easy" };

export default async function BillingPage() {
  const ctx = await getCurrentBusiness();
  if (!ctx) redirect("/app/onboarding");

  const access = await getSubscriptionAccess(
    ctx.business.id,
    ctx.business.created_at,
    ctx.business.comped
  );

  return (
    <main className="flex min-h-dvh items-center justify-center bg-zinc-100 px-4 text-zinc-900">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold">Abbonamento</h1>
          <p className="mt-1 text-sm text-zinc-500">{ctx.business.name}</p>

          <div className="mt-4 rounded-xl border border-zinc-200 p-4">
            <p className="font-semibold">{PLAN.name}</p>
            <p className="mt-1 text-2xl font-bold">
              {formatEUR(PLAN.priceMinor)}
              <span className="text-sm font-normal text-zinc-500">/mese</span>
            </p>
            <ul className="mt-2 space-y-1 text-sm text-zinc-600">
              <li>✓ Accesso completo, senza limiti</li>
              <li>✓ Pagina di prenotazione online</li>
              <li>✓ Acconto del 50% con blocco dell&apos;orario</li>
              <li>✓ Prova gratuita di {TRIAL_DAYS} giorni</li>
            </ul>
          </div>

          <BillingPanel
            status={access.status}
            allowed={access.allowed}
            trialDaysLeft={access.trialDaysLeft}
            hasStripeCustomer={Boolean(access.subscription?.stripe_customer_id)}
          />
        </div>

        {access.allowed && (
          <p className="mt-4 text-center text-sm">
            <Link href="/app" className="text-zinc-600 underline">
              ← Torna al pannello
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
