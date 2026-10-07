/**
 * Plano e política de acesso do SaaS.
 *
 * Decisões de produto concentradas aqui (mude os valores, não a lógica):
 *   PLAN        — Plano Único, R$ 49,90/mês, acesso total.
 *   TRIAL_DAYS  — teste grátis ao criar o negócio (7 dias).
 *   GRACE_DAYS  — carência após cobrança vencida antes de bloquear (3 dias).
 */

import type { Subscription, SubscriptionStatus } from "@/types/database";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const PLAN = {
  name: "Plano Único",
  priceMinor: 4990,
  /** Valor no formato da Asaas (reais, decimal). */
  asaasValue: 49.9,
  description: "Agenda Easy — Plano Único (acesso total)",
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
