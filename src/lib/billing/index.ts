/**
 * Piano e politica di accesso del SaaS.
 *
 * Decisioni di prodotto concentrate qui (cambia i valori, non la logica):
 *   PLAN        — Piano Unico, 9,90 €/mese, accesso completo.
 *   TRIAL_DAYS  — prova gratuita alla creazione dell'attività (7 giorni).
 *   GRACE_DAYS  — tolleranza dopo un addebito scaduto prima del blocco (3 giorni).
 */

import type { Subscription, SubscriptionStatus } from "@/types/database";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const PLAN = {
  name: "Piano Unico",
  priceMinor: 990, // 9,90 € in centesimi (Stripe usa lo stesso formato)
  description: "Agenda Easy — Piano Unico (accesso completo)",
} as const;

export const TRIAL_DAYS = 7;
export const GRACE_DAYS = 3;

const DAY_MS = 24 * 60 * 60 * 1000;

export interface SubscriptionAccess {
  allowed: boolean;
  status: SubscriptionStatus;
  /** Dias restantes de teste (apenas quando status = trialing). */
  trialDaysLeft: number | null;
  subscription: Subscription | null;
}

function computeAccess(
  sub: Subscription | null,
  businessCreatedAt: string,
  now: Date
): SubscriptionAccess {
  // Sem linha de assinatura: trial implícito contado da criação do negócio.
  const trialEnds = sub
    ? new Date(sub.trial_ends_at)
    : new Date(new Date(businessCreatedAt).getTime() + TRIAL_DAYS * DAY_MS);
  const status: SubscriptionStatus = sub?.status ?? "trialing";

  switch (status) {
    case "active":
      return { allowed: true, status, trialDaysLeft: null, subscription: sub };
    case "trialing": {
      const msLeft = trialEnds.getTime() - now.getTime();
      return {
        allowed: msLeft > 0,
        status,
        trialDaysLeft: Math.max(0, Math.ceil(msLeft / DAY_MS)),
        subscription: sub,
      };
    }
    case "past_due": {
      const overdueSince = sub?.overdue_since
        ? new Date(sub.overdue_since)
        : now;
      const allowed =
        now.getTime() - overdueSince.getTime() <= GRACE_DAYS * DAY_MS;
      return { allowed, status, trialDaysLeft: null, subscription: sub };
    }
    case "canceled":
      return { allowed: false, status, trialDaysLeft: null, subscription: sub };
  }
}

/** Acesso permanente para contas cortesia (comped). */
const COMPED_ACCESS: SubscriptionAccess = {
  allowed: true,
  status: "active",
  trialDaysLeft: null,
  subscription: null,
};

/** Lê a assinatura do negócio (RLS: membro) e aplica a política de acesso. */
export async function getSubscriptionAccess(
  businessId: string,
  businessCreatedAt: string,
  comped = false
): Promise<SubscriptionAccess> {
  if (comped) return COMPED_ACCESS;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("business_id", businessId)
    .maybeSingle();

  return computeAccess(
    (data as Subscription | null) ?? null,
    businessCreatedAt,
    new Date()
  );
}

/**
 * Versão pública (sem sessão): decide se a PÁGINA do negócio fica no ar.
 * Trial vencido / assinatura inativa tiram a página pública do ar — exceto
 * negócios cortesia (comped).
 */
export async function isPublicBusinessAllowed(business: {
  id: string;
  created_at: string;
  comped: boolean;
}): Promise<boolean> {
  if (business.comped) return true;
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("business_id", business.id)
    .maybeSingle();
  return computeAccess(
    (data as Subscription | null) ?? null,
    business.created_at,
    new Date()
  ).allowed;
}
