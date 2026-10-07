/** Etichette it-IT condivise tra onboarding, pannello e pagina pubblica. */

import type { BusinessType, Weekday } from "@/types/database";

export const BUSINESS_TYPE_OPTIONS: { value: BusinessType; label: string }[] = [
  { value: "barbershop", label: "Barberia" },
  { value: "hair_salon", label: "Parrucchiere" },
  { value: "beauty", label: "Estetica / bellezza" },
  { value: "other", label: "Altro" },
];

export const WEEKDAY_NAMES: Record<Weekday, string> = {
  0: "Domenica",
  1: "Lunedì",
  2: "Martedì",
  3: "Mercoledì",
  4: "Giovedì",
  5: "Venerdì",
  6: "Sabato",
};

export const WEEKDAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6];
