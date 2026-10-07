"use client";

import { useState, useTransition } from "react";
import type { Lang } from "@/lib/i18n";
import { cancelBookingPublic } from "./actions";

const COPY: Record<
  Lang,
  {
    finished: string;
    done: string;
    rule: string;
    cta: string;
    ctaBusy: string;
  }
> = {
  it: {
    finished: "Questa prenotazione è già stata chiusa.",
    done:
      "Prenotazione annullata. L'orario è stato liberato — se cambi idea, basta prenotare di nuovo.",
    rule: "L'annullamento è consentito fino a 2 ore prima dell'orario.",
    cta: "Annulla la mia prenotazione",
    ctaBusy: "Annullamento…",
  },
  en: {
    finished: "This booking has already been closed.",
    done:
      "Booking cancelled. The slot has been released — if you change your mind, just book again.",
    rule: "Cancellation is allowed up to 2 hours before the appointment.",
    cta: "Cancel my booking",
    ctaBusy: "Cancelling…",
  },
};

export function CancelPanel({
  appointmentId,
  token,
  alreadyCancelled,
  finished,
  lang,
}: {
  appointmentId: string;
  token: string;
  alreadyCancelled: boolean;
  finished: boolean;
  lang: Lang;
}) {
  const t = COPY[lang];
  const [done, setDone] = useState(alreadyCancelled);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (finished) {
    return (
      <p className="mt-4 rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
        {t.finished}
      </p>
    );
  }

  if (done) {
    return (
      <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
        {t.done}
      </p>
    );
  }

  return (
    <div className="mt-4">
      <p className="text-sm text-zinc-500">{t.rule}</p>
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
        {pending ? t.ctaBusy : t.cta}
      </button>
    </div>
  );
}
