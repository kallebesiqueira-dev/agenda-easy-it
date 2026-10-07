"use client";

import { useState, useTransition } from "react";
import { cancelBookingPublic } from "./actions";

export function CancelPanel({
  appointmentId,
  token,
  alreadyCancelled,
  finished,
}: {
  appointmentId: string;
  token: string;
  alreadyCancelled: boolean;
  finished: boolean;
}) {
  const [done, setDone] = useState(alreadyCancelled);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (finished) {
    return (
      <p className="mt-4 rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
        Este agendamento já foi encerrado.
      </p>
    );
  }

  if (done) {
    return (
      <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
        Reserva cancelada. O horário foi liberado — se mudar de ideia, é só
        agendar de novo.
      </p>
    );
  }

  return (
    <div className="mt-4">
      <p className="text-sm text-zinc-500">
        O cancelamento é permitido até 2 horas antes do horário.
      </p>
      {error && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await cancelBookingPublic(appointmentId, token);
            if (result.error) setError(result.error);
            else setDone(true);
          });
        }}
        className="mt-3 w-full rounded-xl bg-red-600 py-3 font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Cancelando…" : "Cancelar minha reserva"}
      </button>
    </div>
  );
}
