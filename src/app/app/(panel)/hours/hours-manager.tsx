"use client";

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
    open: string;
    to: string;
    saving: string;
    saveHours: string;
    saved: string;
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
    open: "Aperto",
    to: "alle",
    saving: "Salvataggio…",
    saveHours: "Salva orari",
    saved: "Salvato ✓",
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
    open: "Open",
    to: "to",
    saving: "Saving…",
    saveHours: "Save hours",
    saved: "Saved ✓",
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
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-semibold">{t.heading}</h2>
        <ul className="space-y-2">
          {week.map((row) => (
            <li
              key={row.weekday}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"
            >
              <span className="w-20 shrink-0">
                {WEEKDAY_NAMES[row.weekday as Weekday]}
              </span>
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={!row.is_closed}
                  onChange={(e) =>
                    updateDay(row.weekday, { is_closed: !e.target.checked })
                  }
                />
                {t.open}
              </label>
              {!row.is_closed && (
                <>
                  <input
                    type="time"
                    value={row.opens_at}
                    onChange={(e) =>
                      updateDay(row.weekday, { opens_at: e.target.value })
                    }
                    className="rounded-lg border border-zinc-300 px-2 py-1"
                  />
                  <span className="text-zinc-400">{t.to}</span>
                  <input
                    type="time"
                    value={row.closes_at}
                    onChange={(e) =>
                      updateDay(row.weekday, { closes_at: e.target.value })
                    }
                    className="rounded-lg border border-zinc-300 px-2 py-1"
                  />
                </>
              )}
            </li>
          ))}
        </ul>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              run(
                () => saveBusinessHours(week),
                () => setSaved(true)
              )
            }
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {pending ? t.saving : t.saveHours}
          </button>
          {saved && <span className="text-sm text-emerald-600">{t.saved}</span>}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
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
                className="rounded px-2 py-0.5 text-zinc-400 hover:text-red-600"
                aria-label={t.removeBreak}
              >
                ✕
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
              className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm"
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
              className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm"
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
              className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-zinc-500">{t.end}</span>
            <input
              type="time"
              required
              value={breakEnd}
              onChange={(e) => setBreakEnd(e.target.value)}
              className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {t.addBreak}
          </button>
        </form>
      </section>
    </div>
  );
}
