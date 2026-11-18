"use client";

/**
 * Banner di consenso: accetta, rifiuta o personalizza.
 * La scelta resta in un cookie di prima parte (6 mesi) e in localStorage.
 * Lo script di analisi parte solo dopo il consenso, e solo se il dominio
 * Plausible è configurato. Senza quella variabile non viene contattato nessuno.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import type { Lang } from "@/lib/i18n";
import { useLang } from "@/lib/i18n/use-lang";

export type ConsentValue = "all" | "essential";

const COOKIE = "ae-consent";
const STORAGE = "ae-consent-v1";
const MAX_AGE = 60 * 60 * 24 * 180;

const COPY: Record<
  Lang,
  {
    title: string;
    body: string;
    accept: string;
    reject: string;
    customize: string;
    save: string;
    necessary: string;
    necessaryHint: string;
    analytics: string;
    analyticsHint: string;
    policy: string;
  }
> = {
  it: {
    title: "Cookie",
    body: "Usiamo cookie tecnici per lingua e accesso. La misurazione delle visite, se attiva su questo sito, parte solo se la accetti.",
    accept: "Accetta",
    reject: "Rifiuta",
    customize: "Personalizza",
    save: "Salva scelta",
    necessary: "Tecnici",
    necessaryHint: "Sempre attivi: lingua e sessione. Il sito non funziona senza.",
    analytics: "Misurazione",
    analyticsHint: "Visite aggregate, solo dopo il consenso e solo se il servizio è configurato.",
    policy: "Informativa cookie",
  },
  en: {
    title: "Cookies",
    body: "We use essential cookies for language and sign-in. Visit measurement, if enabled on this site, starts only if you accept it.",
    accept: "Accept",
    reject: "Reject",
    customize: "Customise",
    save: "Save choice",
    necessary: "Essential",
    necessaryHint: "Always on: language and session. The site does not work without them.",
    analytics: "Measurement",
    analyticsHint: "Aggregate visits, only after consent and only if the service is configured.",
    policy: "Cookie policy",
  },
};

function writeConsent(value: ConsentValue) {
  const payload = JSON.stringify({ v: 1, value, at: new Date().toISOString() });
  try {
    localStorage.setItem(STORAGE, payload);
  } catch {
    /* private mode */
  }
  document.cookie = `${COOKIE}=${value}; path=/; max-age=${MAX_AGE}; samesite=lax`;
  window.dispatchEvent(new CustomEvent("ae-consent", { detail: value }));
}

export function CookieConsent({ initial }: { initial: ConsentValue | null }) {
  const lang = useLang();
  const t = COPY[lang];
  const [choice, setChoice] = useState<ConsentValue | null>(initial);
  const [open, setOpen] = useState(initial === null);
  const [custom, setCustom] = useState(false);
  const [analytics, setAnalytics] = useState(initial === "all");

  useEffect(() => {
    const onOpen = () => {
      setCustom(true);
      setOpen(true);
    };
    const onChoice = (event: Event) => {
      const value = (event as CustomEvent<ConsentValue>).detail;
      setChoice(value);
      setAnalytics(value === "all");
    };
    window.addEventListener("ae-consent-open", onOpen);
    window.addEventListener("ae-consent", onChoice);
    return () => {
      window.removeEventListener("ae-consent-open", onOpen);
      window.removeEventListener("ae-consent", onChoice);
    };
  }, []);

  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

  return (
    <>
      {choice === "all" && domain ? (
        <Script defer data-domain={domain} src="https://plausible.io/js/script.js" />
      ) : null}
      {open && (
        <div className="cookie-banner" role="dialog" aria-labelledby="cookie-title">
          <p id="cookie-title" className="text-[15px] font-semibold tracking-[-0.02em]">
            {t.title}
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-[var(--label-2)]">
            {t.body}{" "}
            <Link href="/cookie" className="font-semibold text-[var(--tint)] underline underline-offset-2">
              {t.policy}
            </Link>
          </p>
          {custom && (
            <div className="mt-3 space-y-2">
              <label className="flex items-start gap-3 rounded-[14px] bg-[var(--fill-2)] px-3 py-2">
                <input type="checkbox" defaultChecked disabled className="mt-1" />
                <span>
                  <span className="block text-[14px] font-semibold">{t.necessary}</span>
                  <span className="block text-[12px] text-[var(--label-2)]">{t.necessaryHint}</span>
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-[14px] bg-[var(--fill-2)] px-3 py-2">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={analytics}
                  onChange={(event) => setAnalytics(event.target.checked)}
                />
                <span>
                  <span className="block text-[14px] font-semibold">{t.analytics}</span>
                  <span className="block text-[12px] text-[var(--label-2)]">{t.analyticsHint}</span>
                </span>
              </label>
            </div>
          )}
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <button type="button" className="ui-press min-h-11 flex-1 rounded-full bg-tint px-4 text-[14px] font-semibold" onClick={() => { writeConsent("all"); setOpen(false); }}>
              {t.accept}
            </button>
            <button type="button" className="ui-press min-h-11 flex-1 rounded-full border border-[var(--border)] bg-white px-4 text-[14px] font-semibold" onClick={() => { writeConsent("essential"); setOpen(false); }}>
              {t.reject}
            </button>
            {custom ? (
              <button type="button" className="ui-press min-h-11 flex-1 rounded-full border border-[var(--border)] bg-white px-4 text-[14px] font-semibold" onClick={() => { writeConsent(analytics ? "all" : "essential"); setOpen(false); }}>
                {t.save}
              </button>
            ) : (
              <button type="button" className="ui-press min-h-11 flex-1 rounded-full px-4 text-[14px] font-semibold text-[var(--tint)]" onClick={() => setCustom(true)}>
                {t.customize}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export function ManageCookies({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="font-semibold text-[var(--tint)] underline decoration-[var(--tint)]/40 underline-offset-4"
      onClick={() => window.dispatchEvent(new Event("ae-consent-open"))}
    >
      {label}
    </button>
  );
}
