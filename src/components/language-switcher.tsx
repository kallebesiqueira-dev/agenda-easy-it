"use client";

/**
 * Selettore lingua a tendina: mostra SOLO la bandiera corrente + freccia ▾.
 * Cliccando si apre il menu con le lingue; la scelta scrive il cookie `lang`
 * (1 anno) e fa router.refresh() così i Server Components ri-renderizzano.
 *
 * Le bandiere sono SVG inline (NON emoji): su Windows e su alcuni Android le
 * emoji di bandiera non vengono renderizzate — l'SVG appare identico su
 * Android, iOS, Windows e macOS.
 *
 * Responsive: su mobile solo bandiera + freccia (target touch ≥40px);
 * da tablet/desktop in su compare anche il codice (IT/EN).
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Lang } from "@/lib/i18n";

const YEAR_SECONDS = 60 * 60 * 24 * 365;

function FlagIT({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 20" aria-hidden className={className}>
      <rect width="30" height="20" fill="#ffffff" />
      <rect width="10" height="20" fill="#009246" />
      <rect x="20" width="10" height="20" fill="#CE2B37" />
    </svg>
  );
}

function FlagGB({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 20" aria-hidden className={className}>
      <rect width="30" height="20" fill="#012169" />
      <path d="M0 0l30 20M30 0L0 20" stroke="#ffffff" strokeWidth="4" />
      <path d="M0 0l30 20M30 0L0 20" stroke="#C8102E" strokeWidth="1.6" />
      <path d="M15 0v20M0 10h30" stroke="#ffffff" strokeWidth="7" />
      <path d="M15 0v20M0 10h30" stroke="#C8102E" strokeWidth="4" />
    </svg>
  );
}

const OPTIONS: {
  value: Lang;
  code: string;
  label: string;
  Flag: (props: { className?: string }) => React.ReactElement;
}[] = [
  { value: "it", code: "IT", label: "Italiano", Flag: FlagIT },
  { value: "en", code: "EN", label: "English", Flag: FlagGB },
];

function writeLangCookie(lang: Lang) {
  document.cookie = `lang=${lang}; path=/; max-age=${YEAR_SECONDS}; samesite=lax`;
}

export function LanguageSwitcher({
  current,
  variant = "light",
}: {
  current: Lang;
  /** "light" su sfondi chiari, "dark" su sfondi scuri/colorati. */
  variant?: "light" | "dark";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Chiude cliccando fuori o premendo Esc
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent | TouchEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function setLang(lang: Lang) {
    setOpen(false);
    if (lang === current) return;
    writeLangCookie(lang);
    router.refresh();
  }

  const active = OPTIONS.find((o) => o.value === current) ?? OPTIONS[0];
  const ActiveFlag = active.Flag;

  const trigger =
    variant === "dark"
      ? "border-white/25 bg-white/10 text-white hover:bg-white/20"
      : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50";

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Lingua / Language"
        className={`flex min-h-10 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-sm font-semibold backdrop-blur-sm transition-colors sm:min-h-0 sm:px-3 ${trigger}`}
      >
        <ActiveFlag className="h-3.5 w-5 shrink-0 rounded-[3px] ring-1 ring-black/10" />
        <span className="hidden sm:inline">{active.code}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          aria-hidden
          className={`opacity-70 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M2.5 4.5 6 8l3.5-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Lingua / Language"
          className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 text-zinc-900 shadow-xl"
        >
          {OPTIONS.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                role="option"
                aria-selected={o.value === current}
                onClick={() => setLang(o.value)}
                className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm transition-colors hover:bg-zinc-100 ${
                  o.value === current ? "font-semibold" : ""
                }`}
              >
                <o.Flag className="h-3.5 w-5 shrink-0 rounded-[3px] ring-1 ring-black/10" />
                <span className="flex-1">{o.label}</span>
                {o.value === current && (
                  <span aria-hidden className="text-emerald-600">
                    ✓
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
