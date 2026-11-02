"use client";

import { useLang } from "@/lib/i18n/use-lang";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  const lang = useLang();
  const t =
    lang === "en"
      ? {
          title: "Something went wrong",
          sub: "Try again in a moment. If it persists, contact support.",
          retry: "Try again",
        }
      : {
          title: "Qualcosa è andato storto",
          sub: "Riprova tra qualche istante. Se il problema persiste, contatta il supporto.",
          retry: "Riprova",
        };

  return (
    <main className="flex ui-panel ui-grain relative min-h-dvh flex-col items-center justify-center bg-[var(--bg)] px-4 py-10 text-center text-zinc-900">
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold">{t.title}</h1>
      <p className="mt-1 max-w-sm text-sm text-zinc-500">{t.sub}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-full bg-tint px-5 py-2.5 font-semibold text-white ui-press hover:bg-emerald-700"
      >
        {t.retry}
      </button>
    </main>
  );
}
