/** Labels pt-BR compartilhados entre onboarding, painel e página pública. */

import type { BusinessType, Weekday } from "@/types/database";

export const BUSINESS_TYPE_OPTIONS: { value: BusinessType; label: string }[] = [
  { value: "barbershop", label: "Barbearia" },
  { value: "hair_salon", label: "Salão de cabelo" },
  { value: "beauty", label: "Estética / beleza" },
  { value: "other", label: "Outro" },
];

export const WEEKDAY_NAMES: Record<Weekday, string> = {
  0: "Domingo",
  1: "Segunda",
  2: "Terça",
  3: "Quarta",
  4: "Quinta",
  5: "Sexta",
  6: "Sábado",
};

export const WEEKDAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6];
