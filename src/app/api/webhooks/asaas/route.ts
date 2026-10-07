/**
 * POST /api/webhooks/asaas — eventos de pagamento da assinatura.
 *
 * Autenticação: a Asaas envia o header `asaas-access-token` com o valor
 * configurado no painel ao cadastrar o webhook; comparamos com
 * ASAAS_WEBHOOK_TOKEN. Sempre responder 200 para eventos conhecidos — a
 * Asaas pausa a fila de webhooks após muitas falhas.
 */

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

interface AsaasWebhookEvent {
  event: string;
  payment?: {
    id: string;
    subscription?: string;
    status: string;
    dueDate: string;
  };
}

export async function POST(request: Request) {
  const expected = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!expected || request.headers.get("asaas-access-token") !== expected) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  let event: AsaasWebhookEvent;
  try {
    event = (await request.json()) as AsaasWebhookEvent;
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const subscriptionId = event.payment?.subscription;
  if (!subscriptionId) {
    // Evento que não é de assinatura (ou sem payment) — reconhece e ignora.
    return Response.json({ received: true });
  }

  const supabase = createSupabaseAdminClient();
  const nowIso = new Date().toISOString();

  switch (event.event) {
    // CONFIRMED = pagamento garantido (cartão); RECEIVED = dinheiro caiu (Pix/boleto)
    case "PAYMENT_CONFIRMED":
    case "PAYMENT_RECEIVED": {
      const { error } = await supabase
        .from("subscriptions")
        .update({
          status: "active",
          overdue_since: null,
          last_paid_at: nowIso,
          updated_at: nowIso,
        })
        .eq("asaas_subscription_id", subscriptionId);
      if (error) console.error("webhook asaas update error", error);
      break;
    }
    case "PAYMENT_OVERDUE": {
      const { error } = await supabase
        .from("subscriptions")
        .update({ status: "past_due", updated_at: nowIso })
        .eq("asaas_subscription_id", subscriptionId);
      if (error) console.error("webhook asaas update error", error);
      // overdue_since só na primeira notificação (carência conta do 1º atraso)
      await supabase
        .from("subscriptions")
        .update({ overdue_since: nowIso })
        .eq("asaas_subscription_id", subscriptionId)
        .is("overdue_since", null);
      break;
    }
    default:
      break; // PAYMENT_CREATED etc.: reconhece e ignora
  }

  return Response.json({ received: true });
}
