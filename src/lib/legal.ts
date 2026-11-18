/**
 * Dati societari da compilare prima della pubblicazione.
 * I valori tra parentesi quadre sono segnaposto: non sono dati reali.
 * I testi delle pagine legali vanno rivisti da un professionista.
 */
export const COMPANY = {
  name: "[RAGIONE SOCIALE]",
  vat: "[P. IVA]",
  address: "[SEDE LEGALE]",
  email: "[EMAIL DI CONTATTO]",
  pec: "[PEC]",
  forum: "[FORO COMPETENTE, es. Milano]",
} as const;

export const LEGAL_UPDATED = {
  it: "18 novembre 2026",
  en: "18 November 2026",
} as const;
