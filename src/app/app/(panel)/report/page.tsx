import Link from "next/link";
import { todayInTz, zonedTimeToUtc } from "@/lib/dates";
import { intlLocale, type Lang } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { formatEUR } from "@/lib/money";
import { getCurrentBusiness } from "@/lib/panel/current-business";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface Props {
  searchParams: Promise<{ m?: string }>;
}

const COPY: Record<
  Lang,
  {
    heading: string;
    prevMonth: string;
    currentMonth: string;
    nextMonth: string;
    revenue: string;
    deposits: string;
    completed: string;
    confirmed: string;
    awaiting: string;
    cancelled: string;
    noShows: string;
    totalBookings: string;
    topServices: string;
    noBookings: string;
  }
> = {
  it: {
    heading: "Report",
    prevMonth: "Mese precedente",
    currentMonth: "Mese corrente",
    nextMonth: "Mese successivo",
    revenue: "Ricavi previsti (confermate + completate)",
    deposits: "Acconti ricevuti",
    completed: "Completate",
    confirmed: "Confermate",
    awaiting: "In attesa di acconto",
    cancelled: "Annullate",
    noShows: "Non presentati",
    totalBookings: "Totale prenotazioni",
    topServices: "Servizi più prenotati",
    noBookings: "Nessuna prenotazione in questo mese.",
  },
  en: {
    heading: "Report",
    prevMonth: "Previous month",
    currentMonth: "Current month",
    nextMonth: "Next month",
    revenue: "Expected revenue (confirmed + completed)",
    deposits: "Deposits received",
    completed: "Completed",
    confirmed: "Confirmed",
    awaiting: "Awaiting deposit",
    cancelled: "Cancelled",
    noShows: "No-shows",
    totalBookings: "Total bookings",
    topServices: "Most booked services",
    noBookings: "No bookings this month.",
  },
};

export default async function ReportsPage({ searchParams }: Props) {
  const ctx = (await getCurrentBusiness())!;
  const { business } = ctx;
  const lang = await getLang();
  const t = COPY[lang];
  const sp = await searchParams;

  const todayISO = todayInTz(business.timezone);
  const currentMonth = todayISO.slice(0, 7);
  const month = /^\d{4}-\d{2}$/.test(sp.m ?? "") ? sp.m! : currentMonth;
  const [yy, mm] = month.split("-").map(Number);
  const pad = (n: number) => String(n).padStart(2, "0");
  const prevM = mm === 1 ? `${yy - 1}-12` : `${yy}-${pad(mm - 1)}`;
  const nextM = mm === 12 ? `${yy + 1}-01` : `${yy}-${pad(mm + 1)}`;

  const monthStart = zonedTimeToUtc(`${month}-01`, "00:00", business.timezone);
  const monthEnd = zonedTimeToUtc(`${nextM}-01`, "00:00", business.timezone);

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("appointments")
    .select(
      "status, service_price_minor, deposit_due_minor, deposit_paid_at, hold_expires_at, service:services(name)"
    )
    .eq("business_id", business.id)
    .gte("starts_at", monthStart.toISOString())
    .lt("starts_at", monthEnd.toISOString());

  const rows = (data ?? []) as unknown as {
    status: string;
    service_price_minor: number;
    deposit_due_minor: number;
    deposit_paid_at: string | null;
    hold_expires_at: string | null;
    service: { name: string } | null;
  }[];

  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
  const nowRef = new Date();
  // La prenotazione trattenuta scaduta non conta come "in attesa di acconto" — l'orario è tornato libero.
  const byStatus = (s: string) =>
    rows.filter(
      (r) =>
        r.status === s &&
        !(
          s === "awaiting_deposit" &&
          r.hold_expires_at &&
          new Date(r.hold_expires_at) < nowRef
        )
    );

  const receita = sum(
    rows
      .filter((r) => r.status === "confirmed" || r.status === "completed")
      .map((r) => r.service_price_minor)
  );
  const sinais = sum(
    rows.filter((r) => r.deposit_paid_at !== null).map((r) => r.deposit_due_minor)
  );

  const topServices = [
    ...rows
      .filter((r) => r.status !== "cancelled")
      .reduce((map, r) => {
        const name = r.service?.name ?? "—";
        map.set(name, (map.get(name) ?? 0) + 1);
        return map;
      }, new Map<string, number>()),
  ]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const monthLabel = new Intl.DateTimeFormat(intlLocale(lang), {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(yy, mm - 1, 1, 12)));

  const stats = [
    { label: t.revenue, value: formatEUR(receita) },
    { label: t.deposits, value: formatEUR(sinais) },
    { label: t.completed, value: String(byStatus("completed").length) },
    { label: t.confirmed, value: String(byStatus("confirmed").length) },
    { label: t.awaiting, value: String(byStatus("awaiting_deposit").length) },
    { label: t.cancelled, value: String(byStatus("cancelled").length) },
    { label: t.noShows, value: String(byStatus("no_show").length) },
    { label: t.totalBookings, value: String(rows.length) },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold capitalize">{t.heading} · {monthLabel}</h2>
        <div className="flex items-center gap-1 text-sm">
          <Link
            href={`/app/report?m=${prevM}`}
            className="rounded-lg px-2 py-1 hover:bg-zinc-200"
            aria-label={t.prevMonth}
          >
            ←
          </Link>
          {month !== currentMonth && (
            <Link
              href="/app/report"
              className="rounded-lg px-2 py-1 font-medium hover:bg-zinc-200"
            >
              {t.currentMonth}
            </Link>
          )}
          <Link
            href={`/app/report?m=${nextM}`}
            className="rounded-lg px-2 py-1 hover:bg-zinc-200"
            aria-label={t.nextMonth}
          >
            →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-lg font-bold">{s.value}</p>
            <p className="mt-0.5 text-xs text-zinc-500">{s.label}</p>
          </div>
        ))}
      </div>

      <section className="mt-5 rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="mb-3 font-semibold">{t.topServices}</h3>
        {topServices.length === 0 ? (
          <p className="text-sm text-zinc-500">{t.noBookings}</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {topServices.map(([name, count]) => (
              <li key={name} className="flex items-center justify-between">
                <span>{name}</span>
                <span className="font-semibold">{count}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
