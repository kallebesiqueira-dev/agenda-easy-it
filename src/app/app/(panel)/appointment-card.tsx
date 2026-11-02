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
  confirmed: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-zinc-100 text-zinc-500",
  completed: "bg-blue-50 text-blue-800",
  no_show: "bg-red-50 text-red-700",
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

  const actions = data.status === "confirmed"
    ? ([
        ["completed", t.complete, "bg-[var(--green)]"],
        ["no_show", t.noShow, "bg-[var(--orange)]"],
        ["cancelled", t.cancel, "bg-[var(--red)]"],
      ] as const)
    : [];

  return (
    <div aria-busy={pending} className={`ios-swipe sm:overflow-visible ${pending ? "animate-pulse" : ""}`}>
      <div className={`flex w-full gap-4 bg-[var(--card)] px-4 py-3.5 ${inactive ? "opacity-55" : ""}`}>
        <div className="w-14 shrink-0 text-right tabular-nums">
          <p className="ios-headline">{start}</p>
          {end && <p className="ios-footnote text-[var(--label-2)]">{end}</p>}
        </div>
        <span className={`w-[3px] shrink-0 rounded-full ${STATUS_RAIL[data.status]}`} aria-hidden />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="ios-headline truncate">{data.customerName}</p>
              <p className="ios-subhead text-[var(--label-2)]">
                {data.serviceName} · {data.professionalName}
              </p>
              {data.customerPhone && (
                <a
                  href={`https://wa.me/39${data.customerPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ios-footnote mt-0.5 inline-block text-[var(--tint)] tabular-nums"
                >
                  {data.customerPhone}
                </a>
              )}
            </div>
            <div className="shrink-0 text-right">
              <span className={`ios-caption inline-block rounded-full px-2 py-0.5 font-semibold ${badge.className}`}>
                {badge.label}
              </span>
              <p className="ios-subhead mt-1 font-semibold tabular-nums">{data.priceLabel}</p>
            </div>
          </div>
          <span className="sr-only">{t.total}</span>

          {error && (
            <p role="alert" className="ios-footnote mt-2 rounded-[10px] bg-red-50 px-3 py-2 text-[var(--red)]">
              {error}
            </p>
          )}

          {actions.length > 0 && (
            <div className="mt-3 hidden flex-wrap gap-2 sm:flex">
              {actions.map(([status, label], i) => (
                <ActionButton
                  key={status}
                  primary={i === 0}
                  disabled={pending}
                  onClick={() => run(() => setAppointmentStatus(data.id, status))}
                >
                  {i === 0 && <IconCheck size={16} />}
                  {label}
                </ActionButton>
              ))}
            </div>
          )}
        </div>
      </div>
      {actions.length > 0 && (
        <div className="flex sm:hidden">
          {actions.map(([status, label, bg]) => (
            <button
              key={status}
              type="button"
              disabled={pending}
              onClick={() => run(() => setAppointmentStatus(data.id, status))}
              className={`ios-footnote w-[76px] px-1 font-semibold text-white ${bg}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
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
      className={`ios-subhead inline-flex min-h-9 items-center gap-1.5 rounded-full px-3.5 font-semibold disabled:opacity-60 ${
        primary ? "bg-tint text-white" : "bg-[var(--fill-2)] text-[var(--tint)] hover:bg-[var(--fill)]"
      }`}
    >
      {children}
    </button>
  );
}
