"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Weekday } from "@/types/database";
import type { Lang } from "@/lib/i18n";
import { weekdayNames, WEEKDAYS } from "@/lib/labels";
import { mediaUrl, uploadMedia } from "@/lib/storage";
import { addShift, deleteShift, saveProfessional } from "./actions";

const COPY: Record<
  Lang,
  {
    heading: string;
    add: string;
    namePh: (label: string) => string;
    save: string;
    cancel: string;
    empty: (label: string) => string;
    changePhoto: string;
    uploadError: string;
    rename: string;
    inactive: string;
    deactivate: string;
    reactivate: string;
    shifts: string;
    noShifts: string;
    removeShift: string;
    day: string;
    start: string;
    end: string;
    addShift: string;
  }
> = {
  it: {
    heading: "Team",
    add: "Aggiungi",
    namePh: (label) => `Nome del ${label.toLowerCase()}`,
    save: "Salva",
    cancel: "Annulla",
    empty: (label) =>
      `Aggiungi almeno un ${label.toLowerCase()} e definisci i turni di lavoro per aprire l'agenda.`,
    changePhoto: "Cambia foto",
    uploadError: "Caricamento della foto non riuscito.",
    rename: "Rinomina",
    inactive: "non attivo",
    deactivate: "Disattiva",
    reactivate: "Riattiva",
    shifts: "Turni",
    noShifts: "Nessun turno — non compare in agenda. Aggiungi i giorni di lavoro.",
    removeShift: "Rimuovi turno",
    day: "Giorno",
    start: "Inizio",
    end: "Fine",
    addShift: "Aggiungi turno",
  },
  en: {
    heading: "Team",
    add: "Add",
    namePh: (label) => `${label}'s name`,
    save: "Save",
    cancel: "Cancel",
    empty: (label) =>
      `Add at least one ${label.toLowerCase()} and set their working shifts to open the agenda.`,
    changePhoto: "Change photo",
    uploadError: "Couldn't upload the photo.",
    rename: "Rename",
    inactive: "inactive",
    deactivate: "Deactivate",
    reactivate: "Reactivate",
    shifts: "Shifts",
    noShifts: "No shifts — not shown in the agenda. Add working days.",
    removeShift: "Remove shift",
    day: "Day",
    start: "Start",
    end: "End",
    addShift: "Add shift",
  },
};

interface ProfessionalRow {
  id: string;
  display_name: string;
  active: boolean;
  image_path: string | null;
}

interface ShiftRow {
  id: string;
  professional_id: string;
  weekday: number;
  starts_at: string;
  ends_at: string;
}

/** "HH:MM:SS" di Postgres → "HH:MM" */
const hhmm = (t: string) => t.slice(0, 5);

export function ProfessionalsManager({
  businessId,
  lang,
  label,
  professionals,
  shifts,
}: {
  businessId: string;
  lang: Lang;
  label: string;
  professionals: ProfessionalRow[];
  shifts: ShiftRow[];
}) {
  const t = COPY[lang];
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function addProfessional(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await saveProfessional({
        display_name: newName.trim(),
        active: true,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setNewName("");
      setAdding(false);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">{t.heading}</h2>
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white"
        >
          {t.add}
        </button>
      </div>

      {adding && (
        <form
          onSubmit={addProfessional}
          className="mb-4 flex gap-2 rounded-2xl bg-white p-4 shadow-sm"
        >
          <input
            required
            maxLength={60}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
            placeholder={t.namePh(label)}
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {t.save}
          </button>
          <button
            type="button"
            onClick={() => setAdding(false)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          >
            {t.cancel}
          </button>
        </form>
      )}

      {error && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {professionals.length === 0 && !adding ? (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-zinc-500 shadow-sm">
          {t.empty(label)}
        </p>
      ) : (
        <ul className="space-y-3">
          {professionals.map((p) => (
            <li key={p.id}>
              <ProfessionalCard
                businessId={businessId}
                lang={lang}
                t={t}
                professional={p}
                shifts={shifts.filter((s) => s.professional_id === p.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ProfessionalCard({
  businessId,
  lang,
  t,
  professional,
  shifts,
}: {
  businessId: string;
  lang: Lang;
  t: (typeof COPY)[Lang];
  professional: ProfessionalRow;
  shifts: ShiftRow[];
}) {
  const WEEKDAY_NAMES = weekdayNames(lang);
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState(professional.display_name);
  const [weekday, setWeekday] = useState<Weekday>(1);
  const [startsAt, setStartsAt] = useState("09:00");
  const [endsAt, setEndsAt] = useState("18:00");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div
      className={`rounded-2xl bg-white p-4 shadow-sm ${professional.active ? "" : "opacity-60"}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <label className="group relative cursor-pointer" title={t.changePhoto}>
            {professional.image_path ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mediaUrl(professional.image_path)!}
                alt={professional.display_name}
                className="size-10 rounded-full object-cover"
              />
            ) : (
              <span className="flex size-10 items-center justify-center rounded-full bg-zinc-100 font-semibold text-zinc-400">
                {professional.display_name.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-zinc-900 text-[9px] text-white">
              ✎
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                run(async () => {
                  try {
                    const path = await uploadMedia(businessId, "team", file);
                    return saveProfessional({
                      id: professional.id,
                      display_name: professional.display_name,
                      active: professional.active,
                      image_path: path,
                    });
                  } catch {
                    return { error: t.uploadError };
                  }
                });
              }}
            />
          </label>
          {renaming ? (
            <form
              className="flex items-center gap-1.5"
              onSubmit={(e) => {
                e.preventDefault();
                run(() =>
                  saveProfessional({
                    id: professional.id,
                    display_name: nameDraft.trim(),
                    active: professional.active,
                  })
                );
                setRenaming(false);
              }}
            >
              <input
                autoFocus
                required
                minLength={2}
                maxLength={60}
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                className="w-36 rounded-lg border border-zinc-300 px-2 py-1 text-sm outline-none focus:border-zinc-900"
              />
              <button
                type="submit"
                disabled={pending}
                className="rounded-lg bg-zinc-900 px-2 py-1 text-sm text-white"
              >
                OK
              </button>
            </form>
          ) : (
            <p className="font-medium">
              {professional.display_name}
              <button
                type="button"
                onClick={() => {
                  setNameDraft(professional.display_name);
                  setRenaming(true);
                }}
                aria-label={t.rename}
                className="ml-1.5 text-zinc-400 hover:text-zinc-700"
              >
                ✎
              </button>
              {!professional.active && (
                <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
                  {t.inactive}
                </span>
              )}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              run(() =>
                saveProfessional({
                  id: professional.id,
                  display_name: professional.display_name,
                  active: !professional.active,
                })
              )
            }
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm disabled:opacity-60"
          >
            {professional.active ? t.deactivate : t.reactivate}
          </button>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            {t.shifts} ({shifts.length})
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 border-t border-zinc-100 pt-3">
          {shifts.length === 0 && (
            <p className="mb-2 text-sm text-zinc-500">
              {t.noShifts}
            </p>
          )}
          <ul className="mb-3 space-y-1">
            {shifts.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between text-sm"
              >
                <span>
                  {WEEKDAY_NAMES[s.weekday as Weekday]} · {hhmm(s.starts_at)}–
                  {hhmm(s.ends_at)}
                </span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => deleteShift(s.id))}
                  className="rounded px-2 py-0.5 text-zinc-400 hover:text-red-600"
                  aria-label={t.removeShift}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>

          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              run(() =>
                addShift({
                  professional_id: professional.id,
                  weekday,
                  starts_at: startsAt,
                  ends_at: endsAt,
                })
              );
            }}
          >
            <label className="block">
              <span className="mb-1 block text-xs text-zinc-500">{t.day}</span>
              <select
                value={weekday}
                onChange={(e) => setWeekday(Number(e.target.value) as Weekday)}
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
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-zinc-500">{t.end}</span>
              <input
                type="time"
                required
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
              />
            </label>
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {t.addShift}
            </button>
          </form>

          {error && (
            <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
