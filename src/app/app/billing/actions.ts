"use server";

/**
 * Checkout da assinatura: cria customer + subscription na Asaas e devolve a
 * URL da fatura (lá o assinante escolhe Pix/boleto/cartão).
 *
 * A linha em `subscriptions` nasce/continua como 'trialing' com prazo
 * estendido em +3 dias: dá tempo do primeiro pagamento compensar sem
 * bloquear o painel. O webhook promove para 'active' quando o dinheiro cai.
 */

import { z } from "zod";
import {
  AsaasError,
  asaasResourceExists,
  createAsaasCustomer,
  createAsaasSubscription,
  listSubscriptionPayments,
} from "@/lib/asaas/client";
import { GRACE_DAYS, PLAN, TRIAL_DAYS } from "@/lib/billing";
import { shiftDateISO, todayInTz } from "@/lib/dates";
import { getCurrentBusiness } from "@/lib/panel/current-business";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cpfCnpjSchema } from "@/lib/validation";
import type { Subscription } from "@/types/database";

export interface CheckoutResult {
  invoiceUrl?: string;
  /** Assinatura criada; a Asaas ainda está gerando a fatura (produção é assíncrona). */
  pending?: boolean;
  error?: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function startSubscription(
  cpfCnpjInput: string
): Promise<CheckoutResult> {
  const parsed = z
    .object({ cpfCnpj: cpfCnpjSchema })
    .safeParse({ cpfCnpj: cpfCnpjInput });
  if (!parsed.success) return { error: "CPF ou CNPJ inválido." };

  const ctx = await getCurrentBusiness();
  if (!ctx) return { error: "Sessão expirada. Entre novamente." };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Sessão expirada. Entre novamente." };

  const admin = createSupabaseAdminClient();
  const { data: existingData } = await admin
    .from("subscriptions")
    .select("*")
    .eq("business_id", ctx.business.id)
    .maybeSingle();
  const existing = existingData as Subscription | null;

  if (existing?.status === "active") {
    return { error: "Sua assinatura já está ativa." };
  }

  try {
    // 1. Customer na Asaas (reaproveita se já existe E ainda for válido —
    // ids do sandbox não existem na produção)
    let customerId = existing?.asaas_customer_id ?? null;
    if (customerId && !(await asaasResourceExists("customers", customerId))) {
      customerId = null;
    }
    if (!customerId) {
      const customer = await createAsaasCustomer({
        name: ctx.business.name,
        cpfCnpj: parsed.data.cpfCnpj,
        email: user.email,
        externalReference: ctx.business.id,
      });
      customerId = customer.id;
    }

    // 2. Assinatura mensal (reaproveita se já existe, não foi cancelada e
    // ainda for válida no ambiente atual)
    let subscriptionId =
      existing && existing.status !== "canceled"
        ? existing.asaas_subscription_id
        : null;
    if (
      subscriptionId &&
      !(await asaasResourceExists("subscriptions", subscriptionId))
    ) {
      subscriptionId = null;
    }
    if (!subscriptionId) {
      const todayISO = todayInTz("America/Sao_Paulo");
      // 1ª cobrança: fim do trial se ainda estiver no futuro, senão amanhã
      const trialEndISO = existing
        ? existing.trial_ends_at.slice(0, 10)
        : shiftDateISO(
            new Date(ctx.business.created_at).toISOString().slice(0, 10),
            TRIAL_DAYS
          );
      const nextDueDate =
        trialEndISO > todayISO ? trialEndISO : shiftDateISO(todayISO, 1);

      const subscription = await createAsaasSubscription({
        customer: customerId,
        value: PLAN.asaasValue,
        nextDueDate,
        description: PLAN.description,
        externalReference: ctx.business.id,
      });
      subscriptionId = subscription.id;
    }

    // 3. Persiste (trial estendido para cobrir a compensação do 1º pagamento)
    const now = new Date();
    const paymentWindow = new Date(
      now.getTime() + GRACE_DAYS * 24 * 60 * 60 * 1000
    );
    const currentTrialEnd = existing ? new Date(existing.trial_ends_at) : now;
    const trialEndsAt =
      currentTrialEnd > paymentWindow ? currentTrialEnd : paymentWindow;

    const { error: upsertError } = await admin.from("subscriptions").upsert({
      business_id: ctx.business.id,
      asaas_customer_id: customerId,
      asaas_subscription_id: subscriptionId,
      status: "trialing",
      trial_ends_at: trialEndsAt.toISOString(),
      overdue_since: null,
      updated_at: now.toISOString(),
    });
    if (upsertError) {
      console.error("subscriptions upsert error", upsertError);
      return { error: "Erro ao salvar a assinatura. Tente novamente." };
    }

    // 4. URL da primeira fatura — na Asaas de produção a geração é
    // assíncrona; tenta por ~10s antes de devolver "pendente".
    for (let attempt = 0; attempt < 5; attempt++) {
      const payments = await listSubscriptionPayments(subscriptionId);
      const invoiceUrl = payments.data[0]?.invoiceUrl;
      if (invoiceUrl) return { invoiceUrl };
      await sleep(2000);
    }
    return { pending: true };
  } catch (err) {
    if (err instanceof AsaasError) {
      // SEC-004: nunca logar o body cru (pode ecoar CPF/e-mail do titular)
      console.error("asaas error", err.status);
      return {
        error:
          err.status === 400
            ? "A Asaas recusou os dados (confira o CPF/CNPJ)."
            : "Falha na comunicação com a Asaas. Tente novamente.",
      };
    }
    if (err instanceof Error && err.message.includes("ASAAS_API_KEY")) {
      return { error: "Pagamentos ainda não configurados (ASAAS_API_KEY)." };
    }
    throw err;
  }
}

/** Fatura em aberto da assinatura atual (para reexibir o link de pagamento). */
export async function getOpenInvoiceUrl(): Promise<string | null> {
  const ctx = await getCurrentBusiness();
  if (!ctx) return null;

  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("subscriptions")
    .select("asaas_subscription_id")
    .eq("business_id", ctx.business.id)
    .maybeSingle();
  const subscriptionId = data?.asaas_subscription_id as string | null;
  if (!subscriptionId) return null;

  try {
    const payments = await listSubscriptionPayments(subscriptionId);
    const open = payments.data.find((p) =>
      ["PENDING", "OVERDUE"].includes(p.status)
    );
    return open?.invoiceUrl ?? null;
  } catch {
    return null;
  }
}
