"use client";

/**
 * Selettore lingua 🇮🇹 IT / 🇬🇧 EN. Scrive il cookie `lang` (1 anno) e fa
 * router.refresh() così i Server Components ri-renderizzano nella nuova lingua.
 */

import { useRouter } from "next/navigation";
import type { Lang } from "@/lib/i18n";

const YEAR_SECONDS = 60 * 60 * 24 * 365;

export function LanguageSwitcher({
  current,
  variant = "light",
}: {
  current: Lang;
  /** "light" su sfondi chiari, "dark" su sfondi scuri/colorati. */
  variant?: "light" | "dark";
}) {
  const router = useRouter();

  function setLang(lang: Lang) {
    if (lang === current) return;
    document.cookie = `lang=${lang}; path=/; max-age=${YEAR_SECONDS}; samesite=lax`;
    router.refresh();
  }

  const base =
    "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold transition-colors";
  const styles =
    variant === "dark"
      ? {
          active: "bg-white/20 text-white",
          idle: "text-white/60 hover:bg-white/10 hover:text-white",
          ring: "border border-white/20",
        }
      : {
          active: "bg-[#17493b] text-white",
          idle: "text-zinc-500 hover:bg-zinc-100",
          ring: "border border-zinc-200 bg-white/70",
        };

  return (
    <div
      className={`flex items-center gap-0.5 rounded-full p-0.5 ${styles.ring}`}
      role="group"
      aria-label="Lingua / Language"
    >
      <button
        type="button"
        onClick={() => setLang("it")}
        aria-pressed={current === "it"}
        className={`${base} ${current === "it" ? styles.active : styles.idle}`}
      >
        <span aria-hidden>🇮🇹</span> IT
      </button>
      <button
        type="button"
        onClick={() => setLang("en")}
        aria-pressed={current === "en"}
        className={`${base} ${current === "en" ? styles.active : styles.idle}`}
      >
        <span aria-hidden>🇬🇧</span> EN
      </button>
    </div>
  );
}
