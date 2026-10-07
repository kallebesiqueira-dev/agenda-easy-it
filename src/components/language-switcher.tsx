"use client";

/**
 * Selettore lingua a tendina: mostra SOLO la bandiera corrente + freccia ▾.
 * Cliccando si apre il menu con le lingue; la scelta scrive il cookie `lang`
 * (1 anno) e fa router.refresh() così i Server Components ri-renderizzano.
 *
 * Responsive: su mobile solo bandiera + freccia (target touch ≥40px);
 * da tablet/desktop in su compare anche il codice (IT/EN).
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Lang } from "@/lib/i18n";

const YEAR_SECONDS = 60 * 60 * 24 * 365;

const OPTIONS: { value: Lang; flag: string; code: string; label: string }[] = [
  { value: "it", flag: "🇮🇹", code: "IT", label: "Italiano" },
  { value: "en", flag: "🇬🇧", code: "EN", label: "English" },
];

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
    document.cookie = `lang=${lang}; path=/; max-age=${YEAR_SECONDS}; samesite=lax`;
    router.refresh();
  }

  const active = OPTIONS.find((o) => o.value === current) ?? OPTIONS[0];

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
        <span aria-hidden className="text-base leading-none">
          {active.flag}
        </span>
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
          className="absolute right-0 z-50 mt-2 w-40 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 text-zinc-900 shadow-xl"
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
                <span aria-hidden className="text-base leading-none">
                  {o.flag}
                </span>
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
