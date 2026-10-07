"use client";

import { useEffect, useState, useTransition } from "react";
import type { SubscriptionStatus } from "@/types/database";
import { getOpenInvoiceUrl, startSubscription } from "./actions";

const STATUS_MESSAGES: Record<SubscriptionStatus, string | null> = {
  trialing: null, // mensagem montada com os dias restantes
  active: "Assinatura ativa. Obrigado!",
  past_due:
    "Sua última cobrança está vencida. Pague a fatura para manter o acesso.",
  canceled: "Assinatura cancelada. Assine novamente para continuar.",
};

export function BillingPanel({
  status,
  allowed,
  trialDaysLeft,
}: {
  status: SubscriptionStatus;
  allowed: boolean;
  trialDaysLeft: number | null;
}) {
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [awaitingInvoice, setAwaitingInvoice] = useState(false);
  const [pending, startTransition] = useTransition();
  const [openInvoiceUrl, setOpenInvoiceUrl] = useState<string | null>(null);

  // Fatura em aberto (pendente/vencida) para reexibir o link de pagamento.
  // Enquanto a Asaas gera a 1ª fatura (awaitingInvoice), verifica a cada 8s.
  useEffect(() => {
    if (status !== "trialing" && status !== "past_due") return;
    getOpenInvoiceUrl().then(setOpenInvoiceUrl);
    if (!awaitingInvoice) return;
    const timer = setInterval(async () => {
      const url = await getOpenInvoiceUrl();
      if (url) {
        setOpenInvoiceUrl(url);
        setAwaitingInvoice(false);
      }
    }, 8000);
    return () => clearInterval(timer);
  }, [status, awaitingInvoice]);

  function subscribe(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await startSubscription(cpfCnpj);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.invoiceUrl) {
        window.location.href = result.invoiceUrl; // fatura da Asaas (externa)
        return;
      }
      if (result.pending) {
        setAwaitingInvoice(true); // fatura em geração — o efeito acima fica verificando
      }
    });
  }

  const message =
    status === "trialing"
      ? trialDaysLeft && trialDaysLeft > 0
        ? `Você está no teste grátis: ${trialDaysLeft} dia(s) restante(s).`
        : "Seu teste grátis terminou. Assine para continuar."
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

      {awaitingInvoice && !openInvoiceUrl && (
        <p className="mt-3 rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-800">
          ✅ Assinatura criada! A Asaas está gerando sua fatura — assim que
          ficar pronta, o botão de pagamento aparece aqui sozinho (estamos
          verificando automaticamente).
        </p>
      )}

      {openInvoiceUrl && (
        <a
          href={openInvoiceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block w-full rounded-xl bg-zinc-900 py-3 text-center font-semibold text-white"
        >
          Pagar fatura em aberto
        </a>
      )}

      {status !== "active" && !openInvoiceUrl && !awaitingInvoice && (
        <form onSubmit={subscribe} className="mt-3 space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">
              CPF ou CNPJ do titular
            </span>
            <input
              required
              inputMode="numeric"
              value={cpfCnpj}
              onChange={(e) => setCpfCnpj(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
              placeholder="000.000.000-00"
            />
            <span className="mt-1 block text-xs text-zinc-400">
              Exigido pela Asaas para emitir a cobrança.
            </span>
          </label>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-zinc-900 py-3 font-semibold text-white disabled:opacity-60"
          >
            {pending ? "Gerando cobrança…" : "Assinar agora"}
          </button>
        </form>
      )}
    </div>
  );
}
