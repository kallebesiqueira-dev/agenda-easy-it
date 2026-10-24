/**
 * Denaro sempre in centesimi interi (minor units) + codice valuta esplicito.
 * MVP limitato a EUR/Italia.
 */

const eur = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
});

/** Formatta centesimi come "45,00 €". */
export function formatEUR(minor: number): string {
  return eur.format(minor / 100);
}

/** Converte l'input dell'operatore ("45", "45,50", "€ 45,50") in centesimi. Restituisce null se non valido. */
export function parseEURToMinor(input: string): number | null {
  const cleaned = input
    .replace(/[€\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  if (cleaned === "" || !/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const minor = Math.round(parseFloat(cleaned) * 100);
  return Number.isSafeInteger(minor) && minor > 0 ? minor : null;
}
