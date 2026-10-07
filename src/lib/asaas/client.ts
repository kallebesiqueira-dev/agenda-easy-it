/**
 * Cliente mínimo da API Asaas (v3). Somente servidor.
 * Sandbox por padrão; produção via ASAAS_BASE_URL=https://api.asaas.com/v3.
 * Docs: https://docs.asaas.com
 */

const DEFAULT_BASE_URL = "https://api-sandbox.asaas.com/v3";

export class AsaasError extends Error {
  constructor(
    public status: number,
    public body: string
  ) {
    super(`Asaas ${status}: ${body}`);
  }
}

async function asaasFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) throw new Error("ASAAS_API_KEY ausente no ambiente.");
  const base = process.env.ASAAS_BASE_URL ?? DEFAULT_BASE_URL;

  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      access_token: apiKey,
      ...init?.headers,
    },
  });
  if (!res.ok) {
    throw new AsaasError(res.status, await res.text());
  }
  return (await res.json()) as T;
}

export interface AsaasCustomer {
  id: string;
}

export function createAsaasCustomer(input: {
  name: string;
  cpfCnpj: string;
  email: string;
  externalReference: string; // business_id, para rastreio no painel Asaas
}): Promise<AsaasCustomer> {
  return asaasFetch("/customers", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export interface AsaasSubscription {
  id: string;
  status: string;
}

export function createAsaasSubscription(input: {
  customer: string;
  value: number; // em reais (decimal), formato da Asaas
  nextDueDate: string; // AAAA-MM-DD
  description: string;
  externalReference: string;
}): Promise<AsaasSubscription> {
  return asaasFetch("/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      ...input,
      billingType: "UNDEFINED", // assinante escolhe Pix/boleto/cartão na fatura
      cycle: "MONTHLY",
    }),
  });
}

export interface AsaasPayment {
  id: string;
  status: string;
  dueDate: string;
  invoiceUrl: string;
}

export function listSubscriptionPayments(
  subscriptionId: string
): Promise<{ data: AsaasPayment[] }> {
  return asaasFetch(`/subscriptions/${subscriptionId}/payments`);
}

/**
 * Confere se um recurso ainda existe na conta/ambiente atual da Asaas.
 * Protege contra ids órfãos (ex.: criados no sandbox e reaproveitados
 * depois da troca para produção).
 */
export async function asaasResourceExists(
  path: "customers" | "subscriptions",
  id: string
): Promise<boolean> {
  try {
    await asaasFetch(`/${path}/${id}`);
    return true;
  } catch (err) {
    if (err instanceof AsaasError && err.status === 404) return false;
    throw err;
  }
}
