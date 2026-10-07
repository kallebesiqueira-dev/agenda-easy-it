"use client";

/**
 * Card della prenotazione nell'agenda del giorno. Riceve dati già formattati
 * dal server (stringhe pronte); qui solo interazione: confermare l'acconto,
 * completare, annullare, non presentato.
 */

import { useState, useTransition } from "react";
import type { Lang } from "@/lib/i18n";
import type { AppointmentStatus } from "@/types/database";
import { confirmDeposit, setAppointmentStatus } from "./actions";

export interface AppointmentCardData {
  id: string;
  timeRange: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  professionalName: string;
  status: AppointmentStatus;
  holdExpired: boolean;
  priceLabel: string;
  depositDueLabel: string;
  depositPaid: boolean;
  holdExpiresLabel: string | null;
}

const STATUS_CLASSES: Record<AppointmentStatus, string> = {
  awaiting_deposit: "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-zinc-100 text-zinc-500",
  completed: "bg-blue-100 text-blue-800",
  no_show: "bg-red-100 text-red-700",
};

const COPY: Record<
  Lang,
  {
    status: Record<AppointmentStatus, string>;
    holdExpired: string;
    total: string;
    deposit: string;
    by: (time: string) => string;
    paid: string;
    depositReceived: string;
    cancel: string;
    complete: string;
    noShow: string;
  }
> = {
  it: {
    status: {
      awaiting_deposit: "In attesa di acconto",
      confirmed: "Confermata",
      cancelled: "Annullata",
      completed: "Completata",
      no_show: "Non presentato",
    },
    holdExpired: "Acconto scaduto",
    total: "Totale",
    deposit: "Acconto",
    by: (time) => ` (entro le ${time})`,
    paid: " ✓ pagato",
    depositReceived: "Acconto ricevuto",
    cancel: "Annulla",
    complete: "Completa",
    noShow: "Non presentato",
  },
  en: {
    status: {
      awaiting_deposit: "Awaiting deposit",
      confirmed: "Confirmed",
      cancelled: "Cancelled",
      completed: "Completed",
      no_show: "No-show",
    },
    holdExpired: "Deposit expired",
    total: "Total",
    deposit: "Deposit",
    by: (time) => ` (by ${time})`,
    paid: " ✓ paid",
    depositReceived: "Deposit received",
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

  const badge = data.holdExpired
    ? { label: t.holdExpired, className: "bg-zinc-100 text-zinc-500" }
    : { label: t.status[data.status], className: STATUS_CLASSES[data.status] };

  function run(action: () => Promise<{ error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) setError(result.error);
    });
  }

  const inactive = data.status === "cancelled" || data.status === "no_show";

  return (
    <div
      className={`rounded-2xl bg-white p-4 shadow-sm ${inactive ? "opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold">{data.timeRange}</p>
          <p className="text-sm">
            {data.customerName}
            {data.customerPhone && (
              <>
                {" · "}
                <a
                  href={`https://wa.me/39${data.customerPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-500 underline"
                >
                  {data.customerPhone}
                </a>
              </>
            )}
          </p>
          <p className="text-sm text-zinc-500">
            {data.serviceName} · {data.professionalName}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${badge.className}`}
        >
          {badge.label}
        </span>
      </div>

      <p className="mt-2 text-sm text-zinc-600">
        {t.total} {data.priceLabel} · {t.deposit} {data.depositDueLabel}
        {data.status === "awaiting_deposit" &&
          !data.holdExpired &&
          data.holdExpiresLabel &&
          t.by(data.holdExpiresLabel)}
        {data.depositPaid && t.paid}
      </p>

      {error && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {data.status === "awaiting_deposit" && (
        <div className="mt-3 flex flex-wrap gap-2">
          <ActionButton
            primary
            disabled={pending}
            onClick={() => run(() => confirmDeposit(data.id, "pix"))}
          >
            {t.depositReceived}
          </ActionButton>
          <ActionButton
            disabled={pending}
            onClick={() => run(() => setAppointmentStatus(data.id, "cancelled"))}
          >
            {t.cancel}
          </ActionButton>
        </div>
      )}

      {data.status === "confirmed" && (
        <div className="mt-3 flex flex-wrap gap-2">
          <ActionButton
            primary
            disabled={pending}
            onClick={() => run(() => setAppointmentStatus(data.id, "completed"))}
          >
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
      className={`rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-60 ${
        primary
          ? "bg-zinc-900 text-white"
          : "border border-zinc-300 text-zinc-700"
      }`}
    >
      {children}
    </button>
  );
}
