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
    awaiting: string;
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
    awaiting: "in attesa di acconto",
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
    awaiting: "awaiting deposit",
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

  // --- Calendário mensal: contagem por dia (confirmados × aguardando sinal) ---
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

  const { data: monthAppointments } = await supabase
    .from("appointments")
    .select("starts_at, status, hold_expires_at")
    .eq("business_id", business.id)
    .in("status", ["awaiting_deposit", "confirmed"])
    .gte("starts_at", monthStart.toISOString())
    .lt("starts_at", monthEnd.toISOString());

  const nowRef = new Date();
  const dayKeyFmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: business.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const dayCounts = new Map<string, { confirmed: number; pending: number }>();
  for (const a of monthAppointments ?? []) {
    if (
      a.status === "awaiting_deposit" &&
      a.hold_expires_at &&
      new Date(a.hold_expires_at) < nowRef
    ) {
      continue; // retenção vencida não ocupa o dia
    }
    const key = dayKeyFmt.format(new Date(a.starts_at));
    const c = dayCounts.get(key) ?? { confirmed: 0, pending: 0 };
    if (a.status === "confirmed") c.confirmed += 1;
    else c.pending += 1;
    dayCounts.set(key, c);
  }

  const monthLabel = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(yy, mm - 1, 1, 12)));

  const { data: appointments } = await supabase
    .from("appointments")
    .select(
      `id, starts_at, ends_at, status, service_price_minor, deposit_due_minor,
       deposit_paid_at, hold_expires_at,
       customer:customers(name, phone),
       service:services(name),
       professional:professionals(display_name)`
    )
    .eq("business_id", business.id)
    .gte("starts_at", dayStart.toISOString())
    .lt("starts_at", dayEnd.toISOString())
    .order("starts_at");

  const now = new Date();
  const cards: AppointmentCardData[] = (appointments ?? []).map((a) => {
    const rec = a as unknown as {
      id: string;
      starts_at: string;
      ends_at: string;
      status: AppointmentStatus;
      service_price_minor: number;
      deposit_due_minor: number;
      deposit_paid_at: string | null;
      hold_expires_at: string | null;
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
      holdExpired:
        rec.status === "awaiting_deposit" &&
        rec.hold_expires_at !== null &&
        new Date(rec.hold_expires_at) < now,
      priceLabel: formatEUR(rec.service_price_minor),
      depositDueLabel: formatEUR(rec.deposit_due_minor),
      depositPaid: rec.deposit_paid_at !== null,
      holdExpiresLabel: rec.hold_expires_at
        ? formatTimeInTz(rec.hold_expires_at, business.timezone)
        : null,
    };
  });

  const dateLabel = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone: business.timezone,
  }).format(zonedTimeToUtc(dateISO, "12:00", business.timezone));

  return (
    <div>
      {/* Calendário mensal */}
      <section className="mb-5 rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold capitalize">{monthLabel}</h2>
          <div className="flex items-center gap-1 text-sm">
            <Link
              href={`/app?date=${prevMonthISO}`}
              className="rounded-lg px-2 py-1 hover:bg-zinc-100"
              aria-label={t.prevMonth}
            >
              ←
            </Link>
            <Link
              href={`/app?date=${nextMonthISO}`}
              className="rounded-lg px-2 py-1 hover:bg-zinc-100"
              aria-label={t.nextMonth}
            >
              →
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-zinc-400">
          {t.weekdays.map((d) => (
            <span key={d} className="py-1">
              {d}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
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
                className={`flex min-h-12 flex-col items-center rounded-lg border p-1 text-sm transition-colors ${
                  isSelected
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : isToday
                      ? "border-zinc-900/40 bg-white hover:bg-zinc-50"
                      : "border-transparent bg-white hover:bg-zinc-50"
                }`}
              >
                <span className={counts ? "font-semibold" : "text-zinc-500"}>
                  {i + 1}
                </span>
                {counts && (
                  <span className="mt-0.5 flex items-center gap-1 text-[10px] leading-none">
                    {counts.confirmed > 0 && (
                      <span
                        className={`rounded-full px-1 py-0.5 font-semibold ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {counts.confirmed}
                      </span>
                    )}
                    {counts.pending > 0 && (
                      <span
                        className={`rounded-full px-1 py-0.5 font-semibold ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {counts.pending}
                      </span>
                    )}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
        <p className="mt-3 flex gap-4 text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-emerald-500" /> {t.confirmed}
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-amber-500" /> {t.awaiting}
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-zinc-300" /> {t.freeDay}
          </span>
        </p>
      </section>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold capitalize">{dateLabel}</h2>
        <div className="flex items-center gap-1 text-sm">
          <Link
            href={`/app?date=${shiftDateISO(dateISO, -1)}`}
            className="rounded-lg px-2 py-1 hover:bg-zinc-200"
            aria-label={t.prevDay}
          >
            ←
          </Link>
          {dateISO !== todayISO && (
            <Link
              href="/app"
              className="rounded-lg px-2 py-1 font-medium hover:bg-zinc-200"
            >
              {t.today}
            </Link>
          )}
          <Link
            href={`/app?date=${shiftDateISO(dateISO, 1)}`}
            className="rounded-lg px-2 py-1 hover:bg-zinc-200"
            aria-label={t.nextDay}
          >
            →
          </Link>
        </div>
      </div>

      {cards.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-zinc-500 shadow-sm">
          {t.empty}
        </p>
      ) : (
        <ul className="space-y-3">
          {cards.map((card) => (
            <li key={card.id}>
              <AppointmentCard data={card} lang={lang} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
