"use client";

import { useState, useTransition } from "react";
import type { SubscriptionStatus } from "@/types/database";
import { openBillingPortal, startStripeCheckout } from "./actions";

const STATUS_MESSAGES: Record<SubscriptionStatus, string | null> = {
  trialing: null, // messaggio costruito con i giorni rimanenti
  active: "Abbonamento attivo. Grazie!",
  past_due:
    "Il tuo ultimo addebito non è andato a buon fine. Aggiorna il pagamento per mantenere l'accesso.",
  canceled: "Abbonamento disdetto. Abbonati di nuovo per continuare.",
};

export function BillingPanel({
  status,
  allowed,
  trialDaysLeft,
  hasStripeCustomer,
}: {
  status: SubscriptionStatus;
  allowed: boolean;
  trialDaysLeft: number | null;
  hasStripeCustomer: boolean;
}) {
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
        ? `Sei nella prova gratuita: ${trialDaysLeft} giorno/i rimanente/i.`
        : "La tua prova gratuita è terminata. Abbonati per continuare."
      : STATUS_MESSAGES[status];

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
          {pending ? "Apertura del checkout…" : "Abbonati ora"}
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
          Gestisci abbonamento e fatture
        </button>
      )}

      <p className="mt-3 text-center text-xs text-zinc-400">
        Pagamento sicuro gestito da Stripe. Carta, SEPA e altri metodi.
      </p>
    </div>
  );
}
