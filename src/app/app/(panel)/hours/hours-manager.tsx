"use client";

import { IconX } from "@/components/icons";
import { PageHero } from "@/components/page-hero";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Weekday } from "@/types/database";
import type { Lang } from "@/lib/i18n";
import { weekdayNames, WEEKDAYS } from "@/lib/labels";
import { addBreak, deleteBreak, saveBusinessHours } from "./actions";

const COPY: Record<
  Lang,
  {
    heading: string;
    subtitle: string;
    tabHours: string;
    tabBreaks: string;
    open: string;
    closed: string;
    to: string;
    saving: string;
    saveHours: string;
    saved: string;
    statDays: string;
    statAvg: string;
    statTotal: string;
    breaks: string;
    breaksSub: string;
    allTeam: string;
    removeBreak: string;
    noBreaks: string;
    who: string;
    day: string;
    start: string;
    end: string;
    addBreak: string;
  }
> = {
  it: {
    heading: "Orari di apertura",
    subtitle: "Imposta gli orari di disponibilità del tuo studio per giorno della settimana.",
    tabHours: "Orari",
    tabBreaks: "Pause",
    open: "Aperto",
    closed: "Chiuso",
    to: "alle",
    saving: "Salvataggio…",
    saveHours: "Salva modifiche",
    saved: "Salvato",
    statDays: "Giorni aperti",
    statAvg: "Media giornaliera",
    statTotal: "Totale settimanale",
    breaks: "Pause",
    breaksSub:
      "Intervalli senza appuntamenti (es.: pranzo) — per tutto il team o per un professionista specifico.",
    allTeam: "Tutto il team",
    removeBreak: "Rimuovi pausa",
    noBreaks: "Nessuna pausa inserita.",
    who: "Chi",
    day: "Giorno",
    start: "Inizio",
    end: "Fine",
    addBreak: "Aggiungi pausa",
  },
  en: {
    heading: "Opening hours",
    subtitle: "Set your studio's availability for each day of the week.",
    tabHours: "Hours",
    tabBreaks: "Breaks",
    open: "Open",
    closed: "Closed",
    to: "to",
    saving: "Saving…",
    saveHours: "Save changes",
    saved: "Saved",
    statDays: "Open days",
    statAvg: "Daily average",
    statTotal: "Weekly total",
    breaks: "Breaks",
    breaksSub:
      "Intervals with no appointments (e.g. lunch) — for the whole team or a specific professional.",
    allTeam: "Whole team",
    removeBreak: "Remove break",
    noBreaks: "No breaks added.",
    who: "Who",
    day: "Day",
    start: "Start",
    end: "End",
    addBreak: "Add break",
  },
};

interface HourRow {
  weekday: number;
  opens_at: string;
  closes_at: string;
  is_closed: boolean;
}

interface BreakRow {
  id: string;
  weekday: number;
  starts_at: string;
  ends_at: string;
  professional_id: string | null;
}

interface ProfessionalOption {
  id: string;
  display_name: string;
}

const hhmm = (t: string) => t.slice(0, 5);

/** Default iniziale: lun–sab 09:00–18:00, domenica chiuso. */
function defaultWeek(saved: HourRow[]): HourRow[] {
  return WEEKDAYS.map((weekday) => {
    const row = saved.find((h) => h.weekday === weekday);
    if (row) return { ...row, opens_at: hhmm(row.opens_at), closes_at: hhmm(row.closes_at) };
    return {
      weekday,
      opens_at: "09:00",
      closes_at: "18:00",
      is_closed: weekday === 0,
    };
  });
}

export function HoursManager({
  lang,
  hours,
  breaks,
  professionals,
}: {
  lang: Lang;
  hours: HourRow[];
  breaks: BreakRow[];
  professionals: ProfessionalOption[];
}) {
  const t = COPY[lang];
  const WEEKDAY_NAMES = weekdayNames(lang);
  const router = useRouter();
  const [week, setWeek] = useState<HourRow[]>(() => defaultWeek(hours));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [breakWeekday, setBreakWeekday] = useState<Weekday>(1);
  const [breakStart, setBreakStart] = useState("12:00");
  const [breakEnd, setBreakEnd] = useState("13:00");
  /** "" = tutto il team; altrimenti id del professionista */
  const [breakProfessional, setBreakProfessional] = useState("");
  const [tab, setTab] = useState<"hours" | "breaks">("hours");

  // Riepilogo settimanale (card statistiche, come nel mockup telefono).
  const toMin = (s: string) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));
  const openDays = week.filter((d) => !d.is_closed);
  const totalMin = openDays.reduce(
    (sum, d) => sum + Math.max(0, toMin(d.closes_at) - toMin(d.opens_at)),
    0
  );
  const totalHours = Math.round(totalMin / 60);
  const avgHours = openDays.length ? Math.round(totalMin / 60 / openDays.length) : 0;
  const stats: [string, string][] = [
    [t.statDays, String(openDays.length)],
    [t.statAvg, `${avgHours} h`],
    [t.statTotal, `${totalHours} h`],
  ];

  const proName = (id: string | null) =>
    id ? professionals.find((p) => p.id === id)?.display_name ?? "—" : null;

  function updateDay(weekday: number, patch: Partial<HourRow>) {
    setSaved(false);
    setWeek((w) =>
      w.map((row) => (row.weekday === weekday ? { ...row, ...patch } : row))
    );
  }

  function run(action: () => Promise<{ error?: string }>, onOk?: () => void) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) setError(result.error);
      else {
        onOk?.();
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-5">
      <PageHero title={t.heading} subtitle={t.subtitle} />

      {/* Tab: Orari | Pause (come nel mockup telefono) */}
      <div role="tablist" className="relative grid grid-cols-2 rounded-[11px] bg-[var(--fill)] p-0.5 text-[14px] font-semibold">
        <span
          aria-hidden
          className={`absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-[9px] bg-[var(--card)] shadow-[0_3px_8px_rgb(0_0_0/0.12)] transition-transform duration-500 ease-[var(--spring)] ${
            tab === "breaks" ? "translate-x-full" : ""
          }`}
        />
        {(
          [
            ["hours", t.tabHours],
            ["breaks", t.tabBreaks],
          ] as ["hours" | "breaks", string][]
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className="relative z-10 min-h-10 rounded-[9px] px-3 active:scale-100"
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "hours" ? (
        <>
          <section className="ios-group">
            {week.map((row) => (
              <div key={row.weekday} className="flex items-center gap-1.5 px-3 py-2.5 sm:gap-2.5 sm:px-4">
                <span className="w-[4.25rem] shrink-0 truncate text-[14px] font-medium sm:w-[4.75rem] sm:text-[15px]">
                  {WEEKDAY_NAMES[row.weekday as Weekday]}
                </span>
                <input
                  type="checkbox"
                  checked={!row.is_closed}
                  onChange={(e) =>
                    updateDay(row.weekday, { is_closed: !e.target.checked })
                  }
                  aria-label={t.open}
                  className="shrink-0"
                />
                {row.is_closed ? (
                  <span className="ml-auto text-[14px] text-[var(--label-3)]">{t.closed}</span>
                ) : (
                  <div className="ml-auto flex min-w-0 items-center justify-end gap-1.5">
                    <input
                      type="time"
                      value={row.opens_at}
                      onChange={(e) =>
                        updateDay(row.weekday, { opens_at: e.target.value })
                      }
                      className="w-[4.5rem] min-w-0 px-1 py-1.5 text-center text-[14px] tabular-nums [&::-webkit-calendar-picker-indicator]:hidden"
                    />
                    <span className="shrink-0 text-[var(--label-3)]">–</span>
                    <input
                      type="time"
                      value={row.closes_at}
                      onChange={(e) =>
                        updateDay(row.weekday, { closes_at: e.target.value })
                      }
                      className="w-[4.5rem] min-w-0 px-1 py-1.5 text-center text-[14px] tabular-nums [&::-webkit-calendar-picker-indicator]:hidden"
                    />
                  </div>
                )}
              </div>
            ))}
          </section>

          {/* Riepilogo settimanale */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {stats.map(([label, value]) => (
              <div key={label} className="rounded-[18px] bg-card p-3.5 text-center sm:p-4">
                <p className="text-[22px] leading-none font-bold tracking-[-0.03em] tabular-nums sm:text-[26px]">
                  {value}
                </p>
                <p className="mt-1.5 text-[11px] leading-snug text-[var(--label-2)] sm:text-[12px]">
                  {label}
                </p>
              </div>
            ))}
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                run(
                  () => saveBusinessHours(week),
                  () => setSaved(true)
                )
              }
              className="bg-tint ui-press min-h-12 flex-1 rounded-full px-4 text-[15px] font-semibold text-white disabled:opacity-60"
            >
              {pending ? t.saving : t.saveHours}
            </button>
            {saved && <span className="text-sm text-[var(--green)]">{t.saved}</span>}
          </div>
        </>
      ) : (
      <section className="rounded-[22px] bg-card p-4 sm:p-5">
        <h2 className="mb-1 font-semibold">{t.breaks}</h2>
        <p className="mb-3 text-sm text-zinc-500">{t.breaksSub}</p>

        <ul className="mb-3 space-y-1">
          {breaks.map((b) => (
            <li key={b.id} className="flex items-center justify-between text-sm">
              <span>
                {WEEKDAY_NAMES[b.weekday as Weekday]} · {hhmm(b.starts_at)}–
                {hhmm(b.ends_at)}
                <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
                  {proName(b.professional_id) ?? t.allTeam}
                </span>
              </span>
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => deleteBreak(b.id))}
                className="grid size-11 place-items-center rounded-full text-zinc-400 hover:bg-red-50 hover:text-red-600"
                aria-label={t.removeBreak}
              >
                <IconX size={16} />
              </button>
            </li>
          ))}
          {breaks.length === 0 && (
            <li className="text-sm text-zinc-400">{t.noBreaks}</li>
          )}
        </ul>

        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(() =>
              addBreak({
                weekday: breakWeekday,
                starts_at: breakStart,
                ends_at: breakEnd,
                professional_id: breakProfessional || null,
              })
            );
          }}
        >
          <label className="block">
            <span className="mb-1 block text-xs text-zinc-500">{t.who}</span>
            <select
              value={breakProfessional}
              onChange={(e) => setBreakProfessional(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-card px-2 py-1.5 text-sm hover:border-zinc-300"
            >
              <option value="">{t.allTeam}</option>
              {professionals.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.display_name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-zinc-500">{t.day}</span>
            <select
              value={breakWeekday}
              onChange={(e) => setBreakWeekday(Number(e.target.value) as Weekday)}
              className="rounded-lg border border-zinc-200 bg-card px-2 py-1.5 text-sm hover:border-zinc-300"
            >
              {WEEKDAYS.map((d) => (
                <option key={d} value={d}>
                  {WEEKDAY_NAMES[d]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-zinc-500">{t.start}</span>
            <input
              type="time"
              required
              value={breakStart}
              onChange={(e) => setBreakStart(e.target.value)}
              className="rounded-lg border border-zinc-200 px-2 py-1.5 text-sm hover:border-zinc-300"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-zinc-500">{t.end}</span>
            <input
              type="time"
              required
              value={breakEnd}
              onChange={(e) => setBreakEnd(e.target.value)}
              className="rounded-lg border border-zinc-200 px-2 py-1.5 text-sm hover:border-zinc-300"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-tint px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60 ui-press hover:bg-emerald-700"
          >
            {t.addBreak}
          </button>
        </form>
      </section>
      )}
    </div>
  );
}
