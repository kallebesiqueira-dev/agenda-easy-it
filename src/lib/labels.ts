/** Etichette condivise (it/en) tra onboarding, pannello e pagina pubblica. */

import type { Lang } from "@/lib/i18n";
import type { BusinessType, Weekday } from "@/types/database";

export function businessTypeOptions(
  lang: Lang
): { value: BusinessType; label: string }[] {
  return lang === "en"
    ? [
        { value: "barbershop", label: "Barbershop" },
        { value: "hair_salon", label: "Hair salon" },
        { value: "beauty", label: "Beauty / aesthetics" },
        { value: "other", label: "Other" },
      ]
    : [
        { value: "barbershop", label: "Barberia" },
        { value: "hair_salon", label: "Parrucchiere" },
        { value: "beauty", label: "Estetica / bellezza" },
        { value: "other", label: "Altro" },
      ];
}

const WEEKDAY_IT: Record<Weekday, string> = {
  0: "Domenica",
  1: "Lunedì",
  2: "Martedì",
  3: "Mercoledì",
  4: "Giovedì",
  5: "Venerdì",
  6: "Sabato",
};

const WEEKDAY_EN: Record<Weekday, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

export function weekdayNames(lang: Lang): Record<Weekday, string> {
  return lang === "en" ? WEEKDAY_EN : WEEKDAY_IT;
}

export const WEEKDAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6];
