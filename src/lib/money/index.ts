/**
 * Dinheiro sempre em centavos inteiros (minor units) + código de moeda explícito.
 * MVP limitado a BRL/Brasil.
 */

/** Sinal obrigatório: 50% do preço vigente, arredondando PARA CIMA ao centavo. */
export function depositDueMinor(priceMinor: number): number {
  if (!Number.isInteger(priceMinor) || priceMinor <= 0) {
    throw new Error("Preço inválido: esperado inteiro positivo em centavos.");
  }
  return Math.ceil(priceMinor / 2);
}

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** Formata centavos como "R$ 45,00". */
export function formatBRL(minor: number): string {
  return brl.format(minor / 100);
}

/** Converte entrada do operador ("45", "45,50", "R$ 45,50") para centavos. Retorna null se inválida. */
export function parseBRLToMinor(input: string): number | null {
  const cleaned = input
    .replace(/[R$\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  if (cleaned === "" || !/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const minor = Math.round(parseFloat(cleaned) * 100);
  return Number.isSafeInteger(minor) && minor > 0 ? minor : null;
}
