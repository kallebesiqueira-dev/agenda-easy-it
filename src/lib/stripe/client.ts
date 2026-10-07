/**
 * Client Stripe — SOLO server (actions / route handlers).
 * Consigliata una chiave ristretta (rk_...) invece della secret completa.
 * Senza STRIPE_SECRET_KEY configurata, getStripe() lancia: i chiamanti
 * traducono l'errore in un messaggio amichevole.
 */

import Stripe from "stripe";

let cached: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY assente nell'ambiente.");
  if (!cached) {
    cached = new Stripe(key);
  }
  return cached;
}

export { Stripe };
