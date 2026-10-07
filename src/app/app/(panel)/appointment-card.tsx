"use client";

/**
 * Card de agendamento na agenda do dia. Recebe dados já formatados do
 * servidor (strings prontas); aqui só interação: confirmar sinal, concluir,
 * cancelar, não compareceu.
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
  awaiting_deposit: { label: "Aguardando sinal", className: "bg-amber-100 text-amber-800" },
  confirmed: { label: "Confirmado", className: "bg-emerald-100 text-emerald-800" },
  cancelled: { label: "Cancelado", className: "bg-zinc-100 text-zinc-500" },
  completed: { label: "Concluído", className: "bg-blue-100 text-blue-800" },
  no_show: { label: "Não compareceu", className: "bg-red-100 text-red-700" },
};

export function AppointmentCard({ data }: { data: AppointmentCardData }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const badge = data.holdExpired
    ? { label: "Sinal vencido", className: "bg-zinc-100 text-zinc-500" }
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
                  href={`https://wa.me/55${data.customerPhone}`}
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
        Total {data.priceLabel} · Sinal {data.depositDueLabel}
        {data.status === "awaiting_deposit" &&
          !data.holdExpired &&
          data.holdExpiresLabel &&
          ` (até ${data.holdExpiresLabel})`}
        {data.depositPaid && " ✓ pago"}
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
            Pix do sinal recebido
          </ActionButton>
          <ActionButton
            disabled={pending}
            onClick={() => run(() => setAppointmentStatus(data.id, "cancelled"))}
          >
            Cancelar
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
            Concluir
          </ActionButton>
          <ActionButton
            disabled={pending}
            onClick={() => run(() => setAppointmentStatus(data.id, "no_show"))}
          >
            Não compareceu
          </ActionButton>
          <ActionButton
            disabled={pending}
            onClick={() => run(() => setAppointmentStatus(data.id, "cancelled"))}
          >
            Cancelar
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
