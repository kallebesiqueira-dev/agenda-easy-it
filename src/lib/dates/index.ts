/**
 * Datas: armazenamento sempre em UTC; exibição e regras de expediente no fuso IANA do negócio.
 * Sem dependências externas — usa Intl, suficiente para o MVP.
 */

import type { Weekday } from "@/types/database";

function tzOffsetMs(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts: Record<string, string> = {};
  for (const p of dtf.formatToParts(date)) parts[p.type] = p.value;
  const asUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second)
  );
  return asUTC - date.getTime();
}

/**
 * Converte data local ("YYYY-MM-DD") + hora local ("HH:MM") no fuso do negócio para Date UTC.
 * Dupla passada cobre transições de horário de verão.
 */
export function zonedTimeToUtc(
  dateISO: string,
  timeHHMM: string,
  timeZone: string
): Date {
  const [y, m, d] = dateISO.split("-").map(Number);
  const [hh, mm] = timeHHMM.split(":").map(Number);
  const utcGuess = Date.UTC(y, m - 1, d, hh, mm);
  const offset1 = tzOffsetMs(new Date(utcGuess), timeZone);
  const offset2 = tzOffsetMs(new Date(utcGuess - offset1), timeZone);
  return new Date(utcGuess - offset2);
}

/** Dia da semana (0=domingo) de uma data "YYYY-MM-DD" interpretada no fuso dado. */
export function weekdayInTz(dateISO: string, timeZone: string): Weekday {
  const noonUtc = zonedTimeToUtc(dateISO, "12:00", timeZone);
  const name = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).format(noonUtc);
  const map: Record<string, Weekday> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[name];
}

/** Formatta un istante UTC come ora locale dell'attività, es. "14:30". */
export function formatTimeInTz(utc: Date | string, timeZone: string): string {
  const d = typeof utc === "string" ? new Date(utc) : utc;
  return new Intl.DateTimeFormat("it-IT", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

/** Formatta un istante UTC come data+ora locali, es. "ven 03/10 alle 14:30". */
export function formatDateTimeInTz(
  utc: Date | string,
  timeZone: string
): string {
  const d = typeof utc === "string" ? new Date(utc) : utc;
  const date = new Intl.DateTimeFormat("it-IT", {
    timeZone,
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  }).format(d);
  return `${date} alle ${formatTimeInTz(d, timeZone)}`;
}

/** Data local de hoje ("YYYY-MM-DD") no fuso do negócio. */
export function todayInTz(timeZone: string): string {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return dtf.format(new Date());
}

/** Desloca uma data "AAAA-MM-DD" em `days` dias (calendário, sem fuso). */
export function shiftDateISO(dateISO: string, days: number): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days, 12)).toISOString().slice(0, 10);
}

/** Soma `minutes` a "HH:MM" (sem passar de 24h — validação de turno garante isso). */
export function addMinutesHHMM(timeHHMM: string, minutes: number): string {
  const [hh, mm] = timeHHMM.split(":").map(Number);
  const total = hh * 60 + mm + minutes;
  const nh = Math.floor(total / 60);
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

/** Compara horas "HH:MM" (-1, 0, 1). */
export function compareHHMM(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
