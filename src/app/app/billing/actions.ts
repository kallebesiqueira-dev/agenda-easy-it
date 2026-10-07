"use server";

/**
 * Checkout dell'abbonamento tramite Stripe (EUR, mensile).
 *
 * Flusso: crea/riusa il Customer → apre una Checkout Session in modalità
 * subscription (i giorni di prova rimanenti diventano trial_period_days) →
 * il webhook /api/webhooks/stripe promuove lo stato quando il pagamento va
 * a buon fine. La gestione successiva (carta, fatture, disdetta) passa dal
 * Customer Portal.
 *
 * La riga in `subscriptions` nasce/continua come 'trialing' con scadenza
 * estesa di qualche giorno: dà tempo al primo pagamento di arrivare senza
 * bloccare il pannello.
 */

import { getStripe } from "@/lib/stripe/client";
import { GRACE_DAYS, PLAN, TRIAL_DAYS } from "@/lib/billing";
import { getCurrentBusiness } from "@/lib/panel/current-business";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Subscription } from "@/types/database";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://agendaeasy.it";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface CheckoutResult {
  /** URL della Checkout Session di Stripe (redirect del browser). */
  url?: string;
  error?: string;
}

/** Suffisso casuale di 8 lettere richiesto dall'integration_identifier. */
function randomSuffix(): string {
  const letters = "abcdefghijklmnopqrstuvwxyz";
  let out = "";
  for (let i = 0; i < 8; i++) {
    out += letters[Math.floor(Math.random() * letters.length)];
  }
  return out;
}

export async function startStripeCheckout(): Promise<CheckoutResult> {
  const ctx = await getCurrentBusiness();
  if (!ctx) return { error: "Sessione scaduta. Accedi di nuovo." };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Sessione scaduta. Accedi di nuovo." };

  const admin = createSupabaseAdminClient();
  const { data: existingData } = await admin
    .from("subscriptions")
    .select("*")
    .eq("business_id", ctx.business.id)
    .maybeSingle();
  const existing = existingData as Subscription | null;

  if (existing?.status === "active") {
    return { error: "Il tuo abbonamento è già attivo." };
  }

  let stripe;
  try {
    stripe = getStripe();
  } catch {
    return { error: "Pagamenti non ancora configurati (STRIPE_SECRET_KEY)." };
  }

  try {
    // 1. Customer (riusa se esiste ancora nell'ambiente attuale — gli id di
    // test non esistono in produzione)
    let customerId = existing?.stripe_customer_id ?? null;
    if (customerId) {
      try {
        const customer = await stripe.customers.retrieve(customerId);
        if (customer.deleted) customerId = null;
      } catch {
        customerId = null;
      }
    }
    if (!customerId) {
      const customer = await stripe.customers.create({
        name: ctx.business.name,
        email: user.email,
        metadata: { business_id: ctx.business.id },
      });
      customerId = customer.id;
    }

    // 2. Giorni di prova rimanenti → trial_period_days della subscription
    const trialEnds = existing
      ? new Date(existing.trial_ends_at)
      : new Date(
          new Date(ctx.business.created_at).getTime() + TRIAL_DAYS * DAY_MS
        );
    const trialDaysLeft = Math.max(
      0,
      Math.ceil((trialEnds.getTime() - Date.now()) / DAY_MS)
    );

    // 3. Checkout Session (nessun payment_method_types: metodi dinamici).
    // STRIPE_PRICE_ID (consigliato in produzione) oppure price inline in EUR.
    const priceId = process.env.STRIPE_PRICE_ID;
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [
        priceId
          ? { price: priceId, quantity: 1 }
          : {
              price_data: {
                currency: "eur",
                unit_amount: PLAN.priceMinor,
                recurring: { interval: "month" },
                product_data: {
                  name: PLAN.name,
                  description: PLAN.description,
                },
              },
              quantity: 1,
            },
      ],
      subscription_data: {
        metadata: { business_id: ctx.business.id },
        ...(trialDaysLeft > 0 ? { trial_period_days: trialDaysLeft } : {}),
      },
      // Codice Fiscale / Partita IVA raccolti da Stripe quando applicabile
      tax_id_collection: { enabled: true },
      customer_update: { name: "auto", address: "auto" },
      billing_address_collection: "required",
      locale: "it",
      success_url: `${SITE_URL}/app/billing?esito=ok`,
      cancel_url: `${SITE_URL}/app/billing`,
      metadata: { business_id: ctx.business.id },
      integration_identifier: `agenda-easy-it-${randomSuffix()}`,
    });

    if (!session.url) {
      return { error: "Creazione del checkout non riuscita. Riprova." };
    }

    // 4. Persiste (prova estesa per coprire l'arrivo del 1º pagamento)
    const now = new Date();
    const paymentWindow = new Date(now.getTime() + GRACE_DAYS * DAY_MS);
    const trialEndsAt = trialEnds > paymentWindow ? trialEnds : paymentWindow;

    const { error: upsertError } = await admin.from("subscriptions").upsert({
      business_id: ctx.business.id,
      stripe_customer_id: customerId,
      status: "trialing",
      trial_ends_at: trialEndsAt.toISOString(),
      overdue_since: null,
      updated_at: now.toISOString(),
    });
    if (upsertError) {
      console.error("subscriptions upsert error", upsertError);
      return { error: "Errore nel salvataggio dell'abbonamento. Riprova." };
    }

    return { url: session.url };
  } catch (err) {
    // Mai loggare il body intero (può contenere e-mail/dati del titolare)
    console.error(
      "stripe checkout error",
      err instanceof Error ? err.message : err
    );
    return { error: "Comunicazione con Stripe non riuscita. Riprova." };
  }
}

/**
 * Customer Portal di Stripe: carta, fatture aperte, disdetta.
 * Disponibile solo dopo che esiste un Customer (primo checkout avviato).
 */
export async function openBillingPortal(): Promise<CheckoutResult> {
  const ctx = await getCurrentBusiness();
  if (!ctx) return { error: "Sessione scaduta. Accedi di nuovo." };

  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("business_id", ctx.business.id)
    .maybeSingle();
  const customerId = data?.stripe_customer_id as string | null;
  if (!customerId) {
    return { error: "Nessun abbonamento da gestire. Abbonati prima." };
  }

  try {
    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${SITE_URL}/app/billing`,
    });
    return { url: session.url };
  } catch (err) {
    console.error(
      "stripe portal error",
      err instanceof Error ? err.message : err
    );
    return { error: "Apertura del portale non riuscita. Riprova." };
  }
}
