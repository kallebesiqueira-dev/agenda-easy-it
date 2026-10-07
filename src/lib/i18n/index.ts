/**
 * i18n minimale a due lingue (it/en) senza librerie esterne.
 *
 * La preferenza vive nel cookie `lang` (1 anno). Default: italiano.
 * Lato server: getLang() in ./server (usa next/headers — NON importare qui).
 * Lato client: useLang() in ./use-lang.
 * Questo modulo è neutro (importabile sia da client sia da server).
 */

export type Lang = "it" | "en";

export const LANG_COOKIE = "lang";

export function normalizeLang(value: string | undefined | null): Lang {
  return value === "en" ? "en" : "it";
}

/** Locale Intl corrispondente (formati di data). */
export function intlLocale(lang: Lang): string {
  return lang === "en" ? "en-GB" : "it-IT";
}
