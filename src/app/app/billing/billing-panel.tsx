"use client";

import { useState, useTransition } from "react";
import type { Lang } from "@/lib/i18n";
import type { SubscriptionStatus } from "@/types/database";
import { openBillingPortal, startStripeCheckout } from "./actions";

const COPY: Record<
  Lang,
  {
    status: Record<SubscriptionStatus, string | null>;
    trialLeft: (days: number) => string;
    trialOver: string;
    openingCheckout: string;
    subscribe: string;
    manage: string;
    securedBy: string;
  }
> = {
  it: {
    status: {
      trialing: null, // messaggio costruito con i giorni rimanenti
      active: "Abbonamento attivo. Grazie!",
      past_due:
        "Il tuo ultimo addebito non è andato a buon fine. Aggiorna il pagamento per mantenere l'accesso.",
      canceled: "Abbonamento disdetto. Abbonati di nuovo per continuare.",
    },
    trialLeft: (days) =>
      `Sei nella prova gratuita: ${days} giorno/i rimanente/i.`,
    trialOver: "La tua prova gratuita è terminata. Abbonati per continuare.",
    openingCheckout: "Apertura del checkout…",
    subscribe: "Abbonati ora",
    manage: "Gestisci abbonamento e fatture",
    securedBy: "Pagamento sicuro gestito da Stripe. Carta, SEPA e altri metodi.",
  },
  en: {
    status: {
      trialing: null,
      active: "Subscription active. Thank you!",
      past_due:
        "Your last charge failed. Update the payment method to keep access.",
      canceled: "Subscription cancelled. Subscribe again to continue.",
    },
    trialLeft: (days) => `You're on the free trial: ${days} day(s) left.`,
    trialOver: "Your free trial has ended. Subscribe to continue.",
    openingCheckout: "Opening checkout…",
    subscribe: "Subscribe now",
    manage: "Manage subscription and invoices",
    securedBy: "Secure payment powered by Stripe. Card, SEPA and more.",
  },
};

export function BillingPanel({
  status,
  allowed,
  trialDaysLeft,
  hasStripeCustomer,
  lang,
}: {
  status: SubscriptionStatus;
  allowed: boolean;
  trialDaysLeft: number | null;
  hasStripeCustomer: boolean;
  lang: Lang;
}) {
  const t = COPY[lang];
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function go(action: () => Promise<{ url?: string; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.url) {
        window.location.href = result.url; // Checkout / Portal di Stripe (esterni)
      }
    });
  }

  const message =
    status === "trialing"
      ? trialDaysLeft && trialDaysLeft > 0
        ? t.trialLeft(trialDaysLeft)
        : t.trialOver
      : t.status[status];

  return (
    <div className="mt-4">
      {message && (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${
            allowed
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-800"
          }`}
        >
          {message}
        </p>
      )}

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {status !== "active" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => go(startStripeCheckout)}
          className="mt-3 w-full rounded-xl bg-zinc-900 py-3 font-semibold text-white disabled:opacity-60"
        >
          {pending ? t.openingCheckout : t.subscribe}
        </button>
      )}

      {hasStripeCustomer && (
        <button
          type="button"
          disabled={pending}
          onClick={() => go(openBillingPortal)}
          className={`mt-3 w-full rounded-xl py-3 font-semibold disabled:opacity-60 ${
            status === "active"
              ? "bg-zinc-900 text-white"
              : "border border-zinc-300 text-zinc-700"
          }`}
        >
          {t.manage}
        </button>
      )}

      <p className="mt-3 text-center text-xs text-zinc-400">{t.securedBy}</p>
    </div>
  );
}
