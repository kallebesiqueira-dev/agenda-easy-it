"use client";

/**
 * Card della prenotazione nell'agenda del giorno. Riceve dati già formattati
 * dal server (stringhe pronte); qui solo interazione: confermare l'acconto,
 * completare, annullare, non presentato.
 */

import { useState, useTransition } from "react";
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

const STATUS_BADGES: Record<
  AppointmentStatus,
  { label: string; className: string }
> = {
  awaiting_deposit: { label: "In attesa di acconto", className: "bg-amber-100 text-amber-800" },
  confirmed: { label: "Confermata", className: "bg-emerald-100 text-emerald-800" },
  cancelled: { label: "Annullata", className: "bg-zinc-100 text-zinc-500" },
  completed: { label: "Completata", className: "bg-blue-100 text-blue-800" },
  no_show: { label: "Non presentato", className: "bg-red-100 text-red-700" },
};

export function AppointmentCard({ data }: { data: AppointmentCardData }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const badge = data.holdExpired
    ? { label: "Acconto scaduto", className: "bg-zinc-100 text-zinc-500" }
    : STATUS_BADGES[data.status];

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
        Totale {data.priceLabel} · Acconto {data.depositDueLabel}
        {data.status === "awaiting_deposit" &&
          !data.holdExpired &&
          data.holdExpiresLabel &&
          ` (entro le ${data.holdExpiresLabel})`}
        {data.depositPaid && " ✓ pagato"}
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
            Acconto ricevuto
          </ActionButton>
          <ActionButton
            disabled={pending}
            onClick={() => run(() => setAppointmentStatus(data.id, "cancelled"))}
          >
            Annulla
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
            Completa
          </ActionButton>
          <ActionButton
            disabled={pending}
            onClick={() => run(() => setAppointmentStatus(data.id, "no_show"))}
          >
            Non presentato
          </ActionButton>
          <ActionButton
            disabled={pending}
            onClick={() => run(() => setAppointmentStatus(data.id, "cancelled"))}
          >
            Annulla
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
