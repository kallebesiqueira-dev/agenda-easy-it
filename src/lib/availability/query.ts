/**
 * Orquestrador de disponibilidade (somente servidor): busca agenda e ocupação
 * via service role e delega a matemática ao motor puro (./index).
 *
 * Usa o client admin porque agendamentos NÃO são legíveis pelo anon — o
 * público só recebe os slots calculados, nunca os dados que os geraram.
 */

import type { AvailabilityQuery } from "@/lib/validation";
import type { AvailableSlot, Weekday } from "@/types/database";
import {
  formatTimeInTz,
  todayInTz,
  weekdayInTz,
  zonedTimeToUtc,
} from "@/lib/dates";
import { isPublicBusinessAllowed } from "@/lib/billing";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  appointmentBlocksSlot,
  computeDaySlotStarts,
  hhmmToMinutes,
  minutesToHHMM,
  type MinuteInterval,
} from "./index";

export class AvailabilityError extends Error {
  constructor(public code: "business_not_found" | "service_not_found") {
    super(code);
  }
}

/** "HH:MM:SS" do Postgres → "HH:MM" (tipos time chegam com segundos). */
function trimSeconds(t: string): string {
  return t.slice(0, 5);
}

export async function getDayAvailability(
  query: AvailabilityQuery
): Promise<AvailableSlot[]> {
  const supabase = createSupabaseAdminClient();
  const nowUtc = new Date();

  const { data: business } = await supabase
    .from("businesses")
    .select("id, timezone, comped, created_at")
    .eq("slug", query.business_slug)
    .eq("published", true)
    .maybeSingle();
  if (!business) throw new AvailabilityError("business_not_found");

  // Assinatura vencida: negócio some do ar também para reservas via API
  if (!(await isPublicBusinessAllowed(business))) {
    throw new AvailabilityError("business_not_found");
  }

  const { data: service } = await supabase
    .from("services")
    .select("id, duration_minutes")
    .eq("id", query.service_id)
    .eq("business_id", business.id)
    .eq("active", true)
    .maybeSingle();
  if (!service) throw new AvailabilityError("service_not_found");

  let professionalsQuery = supabase
    .from("professionals")
    .select("id")
    .eq("business_id", business.id)
    .eq("active", true);
  if (query.professional_id) {
    professionalsQuery = professionalsQuery.eq("id", query.professional_id);
  }
  const { data: professionals } = await professionalsQuery;
  if (!professionals || professionals.length === 0) return [];
  const professionalIds = professionals.map((p) => p.id);

  const weekday: Weekday = weekdayInTz(query.date, business.timezone);

  const [hoursRes, shiftsRes, breaksRes, appointmentsRes] = await Promise.all([
    supabase
      .from("business_hours")
      .select("opens_at, closes_at, is_closed")
      .eq("business_id", business.id)
      .eq("weekday", weekday)
      .maybeSingle(),
    supabase
      .from("professional_shifts")
      .select("professional_id, starts_at, ends_at")
      .eq("business_id", business.id)
      .eq("weekday", weekday)
      .in("professional_id", professionalIds),
    supabase
      .from("breaks")
      .select("professional_id, starts_at, ends_at")
      .eq("business_id", business.id)
      .eq("weekday", weekday),
    // Janela do dia local: [00:00, 24:00) convertida para UTC
    (() => {
      const dayStart = zonedTimeToUtc(query.date, "00:00", business.timezone);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      return supabase
        .from("appointments")
        .select("professional_id, starts_at, ends_at, status, hold_expires_at")
        .in("professional_id", professionalIds)
        .in("status", ["awaiting_deposit", "confirmed"])
        .lt("starts_at", dayEnd.toISOString())
        .gt("ends_at", dayStart.toISOString());
    })(),
  ]);

  const businessHour = hoursRes.data
    ? {
        opens_at: trimSeconds(hoursRes.data.opens_at),
        closes_at: trimSeconds(hoursRes.data.closes_at),
        is_closed: hoursRes.data.is_closed,
      }
    : null;

  const isToday = query.date === todayInTz(business.timezone);
  const nowMinutes = isToday
    ? hhmmToMinutes(formatTimeInTz(nowUtc, business.timezone))
    : null;

  const slots: AvailableSlot[] = [];
  for (const professionalId of professionalIds) {
    const shifts = (shiftsRes.data ?? [])
      .filter((s) => s.professional_id === professionalId)
      .map((s) => ({
        starts_at: trimSeconds(s.starts_at),
        ends_at: trimSeconds(s.ends_at),
      }));

    const breaks = (breaksRes.data ?? [])
      .filter(
        (b) =>
          b.professional_id === null || b.professional_id === professionalId
      )
      .map((b) => ({
        starts_at: trimSeconds(b.starts_at),
        ends_at: trimSeconds(b.ends_at),
      }));

    const busy: MinuteInterval[] = (appointmentsRes.data ?? [])
      .filter(
        (a) =>
          a.professional_id === professionalId &&
          appointmentBlocksSlot(a, nowUtc)
      )
      .map((a) => {
        const start = hhmmToMinutes(
          formatTimeInTz(a.starts_at, business.timezone)
        );
        let end = hhmmToMinutes(formatTimeInTz(a.ends_at, business.timezone));
        if (end <= start) end = 24 * 60; // atravessou a meia-noite: ocupa até o fim do dia
        return { start, end };
      });

    const starts = computeDaySlotStarts({
      businessHour,
      shifts,
      breaks,
      busy,
      serviceDurationMinutes: service.duration_minutes,
      nowMinutes,
    });

    for (const startMinutes of starts) {
      const startsAtUtc = zonedTimeToUtc(
        query.date,
        minutesToHHMM(startMinutes),
        business.timezone
      );
      slots.push({
        professional_id: professionalId,
        starts_at: startsAtUtc.toISOString(),
        ends_at: new Date(
          startsAtUtc.getTime() + service.duration_minutes * 60 * 1000
        ).toISOString(),
      });
    }
  }

  slots.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  return slots;
}
