/**
 * POST /api/webhooks/stripe — ciclo di vita dell'abbonamento.
 *
 * Verifica la firma (STRIPE_WEBHOOK_SECRET) sul body RAW e sincronizza la
 * tabella `subscriptions`:
 *   checkout.session.completed      → collega la subscription appena creata
 *   customer.subscription.updated   → sincronizza lo stato
 *   customer.subscription.deleted   → canceled
 *   invoice.paid                    → active (+ last_paid_at)
 *   invoice.payment_failed          → past_due (+ overdue_since al 1º fallimento)
 *
 * Eventi da abilitare nell'endpoint del Dashboard Stripe: gli stessi qui sopra.
 */

import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { SubscriptionStatus } from "@/types/database";

/** Mappa stato Stripe → stato interno. null = non toccare la riga. */
function mapStatus(s: Stripe.Subscription.Status): SubscriptionStatus | null {
  switch (s) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    default:
      return null; // incomplete/paused: in attesa, non cambia l'accesso
  }
}

/** business_id dalla metadata della subscription (fonte primaria). */
function businessIdOf(sub: Stripe.Subscription): string | null {
  return sub.metadata?.business_id ?? null;
}

async function syncSubscription(sub: Stripe.Subscription): Promise<void> {
  const admin = createSupabaseAdminClient();
  const status = mapStatus(sub.status);
  if (!status) return;

  const patch: Record<string, unknown> = {
    stripe_subscription_id: sub.id,
    stripe_customer_id:
      typeof sub.customer === "string" ? sub.customer : sub.customer.id,
    status,
    updated_at: new Date().toISOString(),
  };
  if (sub.trial_end) {
    patch.trial_ends_at = new Date(sub.trial_end * 1000).toISOString();
  }
  if (status === "active") {
    patch.overdue_since = null;
  }

  const businessId = businessIdOf(sub);
  const query = admin.from("subscriptions").update(patch);
  const { error } = businessId
    ? await query.eq("business_id", businessId)
    : await query.eq("stripe_subscription_id", sub.id);
  if (error) console.error("stripe webhook sync error", error);
}

/** Id della subscription di una invoice (posizione cambiata tra versioni API). */
function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const parent = (
    invoice as unknown as {
      parent?: { subscription_details?: { subscription?: string | { id: string } } };
    }
  ).parent;
  const fromParent = parent?.subscription_details?.subscription;
  if (fromParent) {
    return typeof fromParent === "string" ? fromParent : fromParent.id;
  }
  const legacy = (invoice as unknown as { subscription?: string | { id: string } })
    .subscription;
  if (legacy) return typeof legacy === "string" ? legacy : legacy.id;
  return null;
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    // Fail-closed: senza secret configurato, nessuno esegue.
    return Response.json({ error: "not_configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return Response.json({ error: "missing_signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    const rawBody = await request.text();
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, secret);
  } catch (err) {
    console.error(
      "stripe webhook signature error",
      err instanceof Error ? err.message : err
    );
    return Response.json({ error: "invalid_signature" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription" || !session.subscription) break;
        const subId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription.id;
        const stripe = getStripe();
        const sub = await stripe.subscriptions.retrieve(subId);
        await syncSubscription(sub);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
      }

      case "invoice.paid": {
        const subId = invoiceSubscriptionId(event.data.object as Stripe.Invoice);
        if (!subId) break;
        const { error } = await admin
          .from("subscriptions")
          .update({
            status: "active",
            last_paid_at: new Date().toISOString(),
            overdue_since: null,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subId);
        if (error) console.error("invoice.paid update error", error);
        break;
      }

      case "invoice.payment_failed": {
        const subId = invoiceSubscriptionId(event.data.object as Stripe.Invoice);
        if (!subId) break;
        // overdue_since solo alla prima notifica (la tolleranza parte dal 1º ritardo)
        const { data } = await admin
          .from("subscriptions")
          .select("overdue_since")
          .eq("stripe_subscription_id", subId)
          .maybeSingle();
        const { error } = await admin
          .from("subscriptions")
          .update({
            status: "past_due",
            overdue_since: data?.overdue_since ?? new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subId);
        if (error) console.error("invoice.payment_failed update error", error);
        break;
      }

      default:
        // Evento non gestito: riconosce e ignora.
        break;
    }
  } catch (err) {
    console.error(
      "stripe webhook handler error",
      err instanceof Error ? err.message : err
    );
    return Response.json({ error: "handler_error" }, { status: 500 });
  }

  return Response.json({ received: true });
}
