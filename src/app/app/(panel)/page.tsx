import { IconCalendarEmpty, IconChevronLeft, IconChevronRight } from "@/components/icons";
import Link from "next/link";
import type { AppointmentStatus } from "@/types/database";
import {
  formatTimeInTz,
  shiftDateISO,
  todayInTz,
  zonedTimeToUtc,
} from "@/lib/dates";
import { intlLocale, type Lang } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { formatEUR } from "@/lib/money";
import { getCurrentBusiness } from "@/lib/panel/current-business";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AppointmentCard, type AppointmentCardData } from "./appointment-card";

interface Props {
  searchParams: Promise<{ date?: string }>;
}

const COPY: Record<
  Lang,
  {
    weekdays: string[];
    prevMonth: string;
    nextMonth: string;
    confirmed: string;
    freeDay: string;
    prevDay: string;
    nextDay: string;
    today: string;
    empty: string;
  }
> = {
  it: {
    weekdays: ["dom", "lun", "mar", "mer", "gio", "ven", "sab"],
    prevMonth: "Mese precedente",
    nextMonth: "Mese successivo",
    confirmed: "confermate",
    freeDay: "giorno libero",
    prevDay: "Giorno precedente",
    nextDay: "Giorno successivo",
    today: "Oggi",
    empty: "Nessuna prenotazione in questo giorno.",
  },
  en: {
    weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    prevMonth: "Previous month",
    nextMonth: "Next month",
    confirmed: "confirmed",
    freeDay: "free day",
    prevDay: "Previous day",
    nextDay: "Next day",
    today: "Today",
    empty: "No bookings on this day.",
  },
};

export default async function AgendaPage({ searchParams }: Props) {
  const ctx = (await getCurrentBusiness())!; // il layout garantisce
  const { business } = ctx;
  const lang = await getLang();
  const t = COPY[lang];
  const locale = intlLocale(lang);

  const sp = await searchParams;
  const todayISO = todayInTz(business.timezone);
  const dateISO = /^\d{4}-\d{2}-\d{2}$/.test(sp.date ?? "")
    ? sp.date!
    : todayISO;

  const dayStart = zonedTimeToUtc(dateISO, "00:00", business.timezone);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  // --- Calendário mensal: contagem de confirmados por dia ---
  const [yy, mm] = dateISO.split("-").map(Number);
  const pad = (n: number) => String(n).padStart(2, "0");
  const daysInMonth = new Date(Date.UTC(yy, mm, 0)).getUTCDate();
  const firstWeekday = new Date(Date.UTC(yy, mm - 1, 1, 12)).getUTCDay(); // 0=dom
  const prevMonthISO =
    mm === 1 ? `${yy - 1}-12-01` : `${yy}-${pad(mm - 1)}-01`;
  const nextMonthISO =
    mm === 12 ? `${yy + 1}-01-01` : `${yy}-${pad(mm + 1)}-01`;
  const monthStart = zonedTimeToUtc(`${yy}-${pad(mm)}-01`, "00:00", business.timezone);
  const monthEnd = zonedTimeToUtc(nextMonthISO, "00:00", business.timezone);

  const supabase = await createSupabaseServerClient();

  // Le due query (mese per il calendario + giorno per le card) non dipendono
  // l'una dall'altra: in parallelo si risparmia un round-trip al database.
  const [{ data: monthAppointments }, { data: appointments }] =
    await Promise.all([
      supabase
        .from("appointments")
        .select("starts_at, status")
        .eq("business_id", business.id)
        .eq("status", "confirmed")
        .gte("starts_at", monthStart.toISOString())
        .lt("starts_at", monthEnd.toISOString()),
      supabase
        .from("appointments")
        .select(
          `id, starts_at, ends_at, status, service_price_minor,
       customer:customers(name, phone),
       service:services(name),
       professional:professionals(display_name)`
        )
        .eq("business_id", business.id)
        .gte("starts_at", dayStart.toISOString())
        .lt("starts_at", dayEnd.toISOString())
        .order("starts_at"),
    ]);

  const dayKeyFmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: business.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const dayCounts = new Map<string, { confirmed: number }>();
  for (const a of monthAppointments ?? []) {
    const key = dayKeyFmt.format(new Date(a.starts_at));
    const c = dayCounts.get(key) ?? { confirmed: 0 };
    c.confirmed += 1;
    dayCounts.set(key, c);
  }

  const monthLabel = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(yy, mm - 1, 1, 12)));

  const cards: AppointmentCardData[] = (appointments ?? []).map((a) => {
    const rec = a as unknown as {
      id: string;
      starts_at: string;
      ends_at: string;
      status: AppointmentStatus;
      service_price_minor: number;
      customer: { name: string; phone: string } | null;
      service: { name: string } | null;
      professional: { display_name: string } | null;
    };
    return {
      id: rec.id,
      timeRange: `${formatTimeInTz(rec.starts_at, business.timezone)} – ${formatTimeInTz(rec.ends_at, business.timezone)}`,
      customerName: rec.customer?.name ?? "—",
      customerPhone: rec.customer?.phone ?? "",
      serviceName: rec.service?.name ?? "—",
      professionalName: rec.professional?.display_name ?? "—",
      status: rec.status,
      priceLabel: formatEUR(rec.service_price_minor),
    };
  });

  const dateLabel = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone: business.timezone,
  }).format(zonedTimeToUtc(dateISO, "12:00", business.timezone));

  const confirmedToday = cards.filter((c) => c.status === "confirmed").length;

  return (
    <div className="space-y-8">
      {/* Calendário mensal */}
      <section className="rounded-[22px] bg-card p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="ios-title2 capitalize">
            {monthLabel}
          </h3>
          <div className="flex items-center gap-1">
            <Link href={`/app?date=${prevMonthISO}`} className="ui-press grid size-11 place-items-center rounded-full text-zinc-600 hover:bg-tint/5 hover:text-zinc-900" aria-label={t.prevMonth}>
              <IconChevronLeft />
            </Link>
            <Link href={`/app?date=${nextMonthISO}`} className="ui-press grid size-11 place-items-center rounded-full text-zinc-600 hover:bg-tint/5 hover:text-zinc-900" aria-label={t.nextMonth}>
              <IconChevronRight />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center ios-caption font-semibold text-[var(--label-2)] uppercase">
          {t.weekdays.map((d) => (
            <span key={d} className="py-1.5">
              {d}
            </span>
          ))}
        </div>
        <div key={`${yy}-${mm}`} className="ui-month grid grid-cols-7 gap-1">
          {Array.from({ length: firstWeekday }).map((_, i) => (
            <span key={`pad-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const dISO = `${yy}-${pad(mm)}-${pad(i + 1)}`;
            const counts = dayCounts.get(dISO);
            const isSelected = dISO === dateISO;
            const isToday = dISO === todayISO;
            return (
              <Link
                key={dISO}
                href={`/app?date=${dISO}`}
                aria-current={isSelected ? "date" : undefined}
                className={`ui-press relative flex min-h-12 flex-col items-center justify-center gap-1 rounded-[14px] text-[17px] tabular-nums sm:min-h-14 ${
                  isSelected
                    ? "bg-tint text-white"
                    : isToday
                      ? "bg-[var(--tint-soft)] text-[var(--tint)] ring-1 ring-[var(--tint)]/30 hover:bg-[var(--tint-soft)]"
                      : "hover:bg-zinc-100"
                }`}
              >
                <span className={counts || isSelected || isToday ? "font-semibold" : "text-zinc-500"}>
                  {i + 1}
                </span>
                {counts && counts.confirmed > 0 ? (
                  <span
                    className={`min-w-4 rounded-full px-1 text-[10px] leading-4 font-bold ${
                      isSelected
                        ? "bg-white/25 text-white"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {counts.confirmed}
                  </span>
                ) : (
                  <span className="h-4" aria-hidden />
                )}
              </Link>
            );
          })}
        </div>
        <p className="mt-4 flex gap-5 border-t border-zinc-100 pt-4 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500" /> {t.confirmed}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-zinc-300" /> {t.freeDay}
          </span>
        </p>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="ios-footnote text-[var(--label-2)] tabular-nums">
              {confirmedToday} · {t.confirmed}
            </p>
            <h2 className="ios-large-title capitalize">
              {dateLabel}
            </h2>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-[var(--fill-2)] p-0.5">
            <Link href={`/app?date=${shiftDateISO(dateISO, -1)}`} className="ui-press grid size-11 place-items-center rounded-full text-zinc-600 hover:bg-tint/5 hover:text-zinc-900 size-10" aria-label={t.prevDay}>
              <IconChevronLeft size={18} />
            </Link>
            {dateISO !== todayISO && (
              <Link
                href="/app"
                className="ui-press flex min-h-10 items-center rounded-full px-3 text-sm font-semibold hover:bg-tint/5"
              >
                {t.today}
              </Link>
            )}
            <Link href={`/app?date=${shiftDateISO(dateISO, 1)}`} className="ui-press grid size-11 place-items-center rounded-full text-zinc-600 hover:bg-tint/5 hover:text-zinc-900 size-10" aria-label={t.nextDay}>
              <IconChevronRight size={18} />
            </Link>
          </div>
        </div>

        {cards.length === 0 ? (
          <div className="flex flex-col items-center rounded-[22px] bg-[var(--card)] px-6 py-12 text-center">
            <span className="mb-3 grid size-12 place-items-center rounded-[18px] bg-card text-zinc-400">
              <IconCalendarEmpty size={24} />
            </span>
            <p className="max-w-xs text-sm text-zinc-500">{t.empty}</p>
          </div>
        ) : (
          <ul className="ios-group">
            {cards.map((card) => (
              <li key={card.id}>
                <AppointmentCard data={card} lang={lang} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
