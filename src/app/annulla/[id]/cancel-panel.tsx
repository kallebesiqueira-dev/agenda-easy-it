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
        Questa prenotazione è già stata chiusa.
      </p>
    );
  }

  if (done) {
    return (
      <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
        Prenotazione annullata. L&apos;orario è stato liberato — se cambi idea,
        basta prenotare di nuovo.
      </p>
    );
  }

  return (
    <div className="mt-4">
      <p className="text-sm text-zinc-500">
        L&apos;annullamento è consentito fino a 2 ore prima dell&apos;orario.
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
        {pending ? "Annullamento…" : "Annulla la mia prenotazione"}
      </button>
    </div>
  );
}
