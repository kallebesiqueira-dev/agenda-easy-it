"use client";

/**
 * Card della prenotazione nell'agenda del giorno. Riceve dati già formattati
 * dal server (stringhe pronte); qui solo interazione: completare, annullare,
 * non presentato.
 */

import { useState, useTransition } from "react";
import type { Lang } from "@/lib/i18n";
import type { AppointmentStatus } from "@/types/database";
import { IconCheck } from "@/components/icons";
import { setAppointmentStatus } from "./actions";

export interface AppointmentCardData {
  id: string;
  timeRange: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  professionalName: string;
  status: AppointmentStatus;
  priceLabel: string;
}

const STATUS_CLASSES: Record<AppointmentStatus, string> = {
  confirmed: "bg-emerald-50 text-emerald-700 ring-emerald-700/15",
  cancelled: "bg-zinc-100 text-zinc-500 ring-zinc-500/15",
  completed: "bg-blue-50 text-blue-800 ring-blue-800/15",
  no_show: "bg-red-50 text-red-700 ring-red-700/15",
};

const STATUS_RAIL: Record<AppointmentStatus, string> = {
  confirmed: "bg-emerald-500",
  cancelled: "bg-zinc-300",
  completed: "bg-blue-800/60",
  no_show: "bg-red-500",
};

const COPY: Record<
  Lang,
  {
    status: Record<AppointmentStatus, string>;
    total: string;
    cancel: string;
    complete: string;
    noShow: string;
  }
> = {
  it: {
    status: {
      confirmed: "Confermata",
      cancelled: "Annullata",
      completed: "Completata",
      no_show: "Non presentato",
    },
    total: "Totale",
    cancel: "Annulla",
    complete: "Completa",
    noShow: "Non presentato",
  },
  en: {
    status: {
      confirmed: "Confirmed",
      cancelled: "Cancelled",
      completed: "Completed",
      no_show: "No-show",
    },
    total: "Total",
    cancel: "Cancel",
    complete: "Complete",
    noShow: "No-show",
  },
};

export function AppointmentCard({
  data,
  lang,
}: {
  data: AppointmentCardData;
  lang: Lang;
}) {
  const t = COPY[lang];
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const badge = {
    label: t.status[data.status],
    className: STATUS_CLASSES[data.status],
  };

  function run(action: () => Promise<{ error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) setError(result.error);
    });
  }

  const inactive = data.status === "cancelled" || data.status === "no_show";

  const [start, end] = data.timeRange.split(" – ");

  return (
    <div
      aria-busy={pending}
      className={`ui-lift relative flex gap-4 overflow-hidden rounded-2xl border border-zinc-900/[0.06] bg-white p-4 shadow-sm sm:p-5 ${inactive ? "opacity-60" : ""} ${pending ? "animate-pulse" : ""}`}
    >
      <span className={`absolute inset-y-0 left-0 w-1 ${STATUS_RAIL[data.status]}`} aria-hidden />
      <div className="w-14 shrink-0 pl-1 tabular-nums">
        <p className="font-[family-name:var(--font-display)] text-xl leading-none font-semibold">
          {start}
        </p>
        {end && <p className="mt-1 text-xs text-zinc-400">{end}</p>}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-semibold">{data.customerName}</p>
            <p className="text-sm text-zinc-500">
              {data.serviceName} · {data.professionalName}
            </p>
            {data.customerPhone && (
              <a
                href={`https://wa.me/39${data.customerPhone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-0.5 inline-block font-[family-name:var(--font-mono)] text-xs text-zinc-500 underline decoration-zinc-300 underline-offset-4 hover:text-emerald-700 hover:decoration-emerald-700"
              >
                {data.customerPhone}
              </a>
            )}
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${badge.className}`}
          >
            {badge.label}
          </span>
        </div>

        <p className="mt-2 text-sm text-zinc-600">
          {t.total} <span className="font-semibold text-zinc-900 tabular-nums">{data.priceLabel}</span>
        </p>

        {error && (
          <p role="alert" className="mt-3 rounded-xl border border-red-700/15 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {data.status === "confirmed" && (
          <div className="mt-4 flex flex-wrap gap-2">
            <ActionButton
              primary
              disabled={pending}
              onClick={() => run(() => setAppointmentStatus(data.id, "completed"))}
            >
              <IconCheck size={16} />
              {t.complete}
            </ActionButton>
            <ActionButton
              disabled={pending}
              onClick={() => run(() => setAppointmentStatus(data.id, "no_show"))}
            >
              {t.noShow}
            </ActionButton>
            <ActionButton
              disabled={pending}
              onClick={() => run(() => setAppointmentStatus(data.id, "cancelled"))}
            >
              {t.cancel}
            </ActionButton>
          </div>
        )}
      </div>
    </div>
  );
}

function ActionButton({
  primary,
  disabled,
  onClick,
  children,
}: {
  primary?: boolean;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-sm font-semibold disabled:opacity-60 ${
        primary
          ? "bg-zinc-900 text-[#f6f1e7] hover:bg-emerald-700"
          : "border border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
      }`}
    >
      {children}
    </button>
  );
}
