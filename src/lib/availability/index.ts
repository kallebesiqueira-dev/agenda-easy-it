/**
 * Motor de disponibilidade — puro e determinístico (testável sem banco).
 *
 * Pipeline para um profissional em uma data:
 *   1. Janela de trabalho = turnos do dia ∩ horário de funcionamento do negócio
 *   2. Subtrai pausas (do profissional e gerais)
 *   3. Subtrai agendamentos ocupados (awaiting_deposit não expirado + confirmed)
 *   4. Fatia o que sobrou em slots do tamanho do serviço, respeitando a
 *      política de passo e antecedência mínima (bookingPolicy)
 *
 * Toda a matemática usa minutos desde a meia-noite LOCAL do negócio;
 * a conversão para UTC acontece nas bordas (lib/dates).
 */

import type {
  Appointment,
  Break,
  BusinessHour,
  ProfessionalShift,
} from "@/types/database";

/** Intervalo em minutos desde 00:00 local. Invariante: start < end. */
export interface MinuteInterval {
  start: number;
  end: number;
}

export function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Interseção de dois intervalos; null se não se sobrepõem. */
export function intersect(
  a: MinuteInterval,
  b: MinuteInterval
): MinuteInterval | null {
  const start = Math.max(a.start, b.start);
  const end = Math.min(a.end, b.end);
  return start < end ? { start, end } : null;
}

/** Remove de `windows` tudo que sobrepõe `busy`, preservando as sobras. */
export function subtract(
  windows: MinuteInterval[],
  busy: MinuteInterval[]
): MinuteInterval[] {
  let result = windows;
  for (const b of busy) {
    const next: MinuteInterval[] = [];
    for (const w of result) {
      if (b.end <= w.start || b.start >= w.end) {
        next.push(w); // sem sobreposição
        continue;
      }
      if (b.start > w.start) next.push({ start: w.start, end: b.start });
      if (b.end < w.end) next.push({ start: b.end, end: w.end });
    }
    result = next;
  }
  return result;
}

/**
 * Política de geração de slots — decisão de negócio, não técnica.
 *
 * TODO(kalle): implemente esta função. Ela define duas coisas:
 *
 *   stepMinutes — de quanto em quanto tempo os horários são oferecidos.
 *     • Passo fixo (ex.: 30) → grade previsível ("9:00, 9:30, 10:00"), mas um
 *       serviço de 45min deixa buracos de 15min inutilizáveis na agenda.
 *     • Passo = duração do serviço → agenda compacta sem buracos, mas os
 *       horários ficam "quebrados" ("9:45, 10:30, 11:15") e serviços de
 *       durações diferentes geram grades diferentes.
 *     • Híbrido comum em barbearias: passo 15min independente da duração —
 *       mais opções pro cliente, pequeno risco de fragmentação.
 *
 *   minLeadMinutes — antecedência mínima para reservar (contada de "agora").
 *     • 0 permite reservar um slot que começa em 2 minutos — o dono pode nem
 *       ver a notificação, e o sinal via Pix não chega a tempo.
 *     • Muito alto (ex.: 24h) mata o caso "encaixe de última hora", que é
 *       receita real para barbearia.
 *
 * Assinatura: recebe a duração do serviço para permitir política dependente
 * do serviço (pode ignorá-la se optar por passo fixo).
 *
 * Decisão (2026-10-03): grade fixa de 30min — horários previsíveis para o
 * cliente; antecedência mínima de 60min para dar tempo do sinal via Pix
 * chegar antes do atendimento.
 */
export function bookingPolicy(_serviceDurationMinutes: number): {
  stepMinutes: number;
  minLeadMinutes: number;
} {
  return { stepMinutes: 30, minLeadMinutes: 60 };
}

export interface DayScheduleInput {
  /** Horário de funcionamento do negócio no dia (null/is_closed = fechado). */
  businessHour: Pick<BusinessHour, "opens_at" | "closes_at" | "is_closed"> | null;
  /** Turnos do profissional no dia. */
  shifts: Pick<ProfessionalShift, "starts_at" | "ends_at">[];
  /** Pausas aplicáveis (do profissional + gerais do negócio). */
  breaks: Pick<Break, "starts_at" | "ends_at">[];
  /** Intervalos ocupados por agendamentos, já convertidos para minutos locais. */
  busy: MinuteInterval[];
  /** Duração do serviço solicitado. */
  serviceDurationMinutes: number;
  /**
   * "Agora" em minutos locais do negócio, ou null se a data consultada é
   * futura (sem corte de antecedência).
   */
  nowMinutes: number | null;
}

/** Horários de início possíveis (minutos locais) para o serviço no dia. */
export function computeDaySlotStarts(input: DayScheduleInput): number[] {
  const { businessHour, serviceDurationMinutes } = input;
  if (!businessHour || businessHour.is_closed) return [];

  const open: MinuteInterval = {
    start: hhmmToMinutes(businessHour.opens_at),
    end: hhmmToMinutes(businessHour.closes_at),
  };

  // 1. Turnos limitados ao horário de funcionamento
  const working = input.shifts
    .map((s) =>
      intersect(open, {
        start: hhmmToMinutes(s.starts_at),
        end: hhmmToMinutes(s.ends_at),
      })
    )
    .filter((w): w is MinuteInterval => w !== null);

  // 2 e 3. Subtrai pausas e ocupados
  const free = subtract(working, [
    ...input.breaks.map((b) => ({
      start: hhmmToMinutes(b.starts_at),
      end: hhmmToMinutes(b.ends_at),
    })),
    ...input.busy,
  ]);

  // 4. Fatia em slots conforme a política
  const { stepMinutes, minLeadMinutes } = bookingPolicy(serviceDurationMinutes);
  const earliest =
    input.nowMinutes === null ? 0 : input.nowMinutes + minLeadMinutes;

  const starts: number[] = [];
  for (const w of free) {
    // Alinha o primeiro slot ao passo (grade ancorada na meia-noite local)
    let t = Math.ceil(w.start / stepMinutes) * stepMinutes;
    while (t + serviceDurationMinutes <= w.end) {
      if (t >= earliest) starts.push(t);
      t += stepMinutes;
    }
  }
  return starts;
}

/**
 * Um agendamento bloqueia o horário se está confirmado, ou se é uma retenção
 * de sinal (awaiting_deposit) ainda dentro do prazo.
 */
export function appointmentBlocksSlot(
  a: Pick<Appointment, "status" | "hold_expires_at">,
  nowUtc: Date
): boolean {
  if (a.status === "confirmed") return true;
  if (a.status === "awaiting_deposit") {
    return a.hold_expires_at !== null && new Date(a.hold_expires_at) > nowUtc;
  }
  return false;
}
