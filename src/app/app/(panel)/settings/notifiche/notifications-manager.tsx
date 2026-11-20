"use client";

/**
 * Impostazioni delle notifiche push — in stile app nativa (iOS / Google Play).
 *
 * Le notifiche sono "sul tuo dispositivo": le preferenze vivono quindi in
 * localStorage (per dispositivo) e il toggle principale usa la vera Web
 * Notifications API (chiede il permesso del browser). "Invia una notifica di
 * prova" mostra una notifica reale. Nessun backend coinvolto.
 */

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { IconChevronLeft } from "@/components/icons";
import type { Lang } from "@/lib/i18n";

const COPY = {
  it: {
    back: "Impostazioni",
    title: "Notifiche push",
    subtitle: "Gestisci quando e come ricevere le notifiche sul tuo dispositivo.",
    heroTitle: "Resta sempre aggiornata",
    heroText: "Ricevi avvisi in tempo reale per prenotazioni, modifiche e promemoria.",
    masterTitle: "Notifiche push",
    masterText: "Attiva le notifiche sul tuo dispositivo.",
    denied: "Notifiche bloccate dal browser. Abilitale dalle impostazioni del sito.",
    unsupported: "Questo dispositivo non supporta le notifiche push.",
    whatHeader: "Cosa vuoi ricevere",
    items: {
      newBooking: ["Nuove prenotazioni", "Quando un cliente prenota un servizio."],
      changes: ["Modifiche e cancellazioni", "Se una prenotazione viene modificata o annullata."],
      reminders: ["Promemoria appuntamenti", "Un avviso prima dell'appuntamento."],
      team: ["Attività del team", "Assegnazioni, modifiche e note del team."],
      summary: ["Riepilogo giornaliero", "Un report serale con le attività della giornata."],
    },
    whenTitle: "Quando riceverle",
    whenText: "Scegli gli orari in cui desideri ricevere le notifiche.",
    whenRange: "Ricevi notifiche dalle",
    whenTo: "alle",
    systemTitle: "Notifiche di sistema",
    systemText: "Aggiornamenti importanti, novità e manutenzioni della piattaforma.",
    test: "Invia una notifica di prova",
    testTitle: "Studio Anna",
    testBody: "Questa è una notifica di prova di Agenda Easy.",
    testSent: "Notifica inviata!",
  },
  en: {
    back: "Settings",
    title: "Push notifications",
    subtitle: "Manage when and how you receive notifications on your device.",
    heroTitle: "Always up to date",
    heroText: "Get real-time alerts for bookings, changes and reminders.",
    masterTitle: "Push notifications",
    masterText: "Enable notifications on your device.",
    denied: "Notifications are blocked by the browser. Enable them in the site settings.",
    unsupported: "This device doesn't support push notifications.",
    whatHeader: "What you want to receive",
    items: {
      newBooking: ["New bookings", "When a client books a service."],
      changes: ["Changes and cancellations", "If a booking is changed or cancelled."],
      reminders: ["Appointment reminders", "An alert before the appointment."],
      team: ["Team activity", "Assignments, changes and team notes."],
      summary: ["Daily summary", "An evening report with the day's activity."],
    },
    whenTitle: "When to receive them",
    whenText: "Choose the hours when you want to receive notifications.",
    whenRange: "Receive notifications from",
    whenTo: "to",
    systemTitle: "System notifications",
    systemText: "Important updates, news and platform maintenance.",
    test: "Send a test notification",
    testTitle: "Studio Anna",
    testBody: "This is a test notification from Agenda Easy.",
    testSent: "Notification sent!",
  },
} satisfies Record<Lang, unknown>;

type ItemKey = "newBooking" | "changes" | "reminders" | "team" | "summary";

interface Prefs {
  master: boolean;
  newBooking: boolean;
  changes: boolean;
  reminders: boolean;
  team: boolean;
  summary: boolean;
  quietEnabled: boolean;
  from: string;
  to: string;
  system: boolean;
}

const DEFAULTS: Prefs = {
  master: true,
  newBooking: true,
  changes: true,
  reminders: true,
  team: false,
  summary: true,
  quietEnabled: true,
  from: "08:00",
  to: "20:00",
  system: true,
};

const STORAGE_KEY = "ae-notif-prefs";

function IconBell({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

export function NotificationsManager({ lang }: { lang: Lang }) {
  const t = COPY[lang];
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [sent, setSent] = useState(false);
  const sentTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Idratazione dallo storage + stato del permesso: lettura da sistemi esterni
  // (localStorage / Notification) che su SSR non esistono, quindi va fatta in
  // effect dopo l'hydration (un initializer causerebbe un mismatch).
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setPrefs({ ...DEFAULTS, ...(JSON.parse(raw) as Partial<Prefs>) });
    } catch {
      /* storage non disponibile: resta sui default */
    }
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
    } else {
      setPermission(Notification.permission);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  function persist(next: Prefs) {
    setPrefs(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignora: preferenza resta solo in memoria */
    }
  }

  const set = <K extends keyof Prefs>(key: K, value: Prefs[K]) =>
    persist({ ...prefs, [key]: value });

  async function toggleMaster(on: boolean) {
    if (on && permission === "default" && "Notification" in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") {
        set("master", false);
        return;
      }
    }
    set("master", on);
  }

  async function sendTest() {
    if (!("Notification" in window)) return;
    let perm = Notification.permission;
    if (perm === "default") {
      perm = await Notification.requestPermission();
      setPermission(perm);
    }
    if (perm !== "granted") return;
    new Notification(t.testTitle, { body: t.testBody, icon: "/icon-192.png" });
    setSent(true);
    if (sentTimer.current) clearTimeout(sentTimer.current);
    sentTimer.current = setTimeout(() => setSent(false), 2500);
  }

  const active = prefs.master && permission === "granted";
  const itemKeys: ItemKey[] = ["newBooking", "changes", "reminders", "team", "summary"];

  return (
    <div className="space-y-5">
      {/* Intestazione con "indietro" (stile app) */}
      <div>
        <Link
          href="/app/settings"
          className="ui-press -ml-1.5 inline-flex items-center gap-0.5 rounded-full py-1 pr-3 pl-1 text-[15px] font-semibold text-[var(--tint)]"
        >
          <IconChevronLeft size={20} />
          {t.back}
        </Link>
        <h2 className="ios-large-title mt-2">{t.title}</h2>
        <p className="mt-1 text-[15px] text-[var(--label-2)]">{t.subtitle}</p>
      </div>

      {/* Banner viola di marca */}
      <div className="brand-fill relative flex items-center gap-4 overflow-hidden rounded-[22px] p-5 text-white shadow-[var(--shadow-md)]">
        <div className="min-w-0 flex-1">
          <p className="text-[19px] font-bold tracking-[-0.02em]">{t.heroTitle}</p>
          <p className="mt-1 text-[14px] leading-snug text-white/85">{t.heroText}</p>
        </div>
        <span className="grid size-14 shrink-0 place-items-center rounded-[18px] bg-white/15 text-white">
          <IconBell size={28} />
        </span>
      </div>

      {/* Toggle principale */}
      <div className="rounded-[22px] bg-card p-4">
        <label className="flex items-center gap-3.5">
          <span className="grid size-11 shrink-0 place-items-center rounded-[13px] bg-[var(--tint-soft)] text-[var(--tint)]">
            <IconBell size={22} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="ios-headline block">{t.masterTitle}</span>
            <span className="ios-subhead block text-[var(--label-2)]">{t.masterText}</span>
          </span>
          <input
            type="checkbox"
            checked={active}
            disabled={permission === "unsupported" || permission === "denied"}
            onChange={(e) => toggleMaster(e.target.checked)}
          />
        </label>
        {permission === "denied" && (
          <p className="mt-3 rounded-[12px] bg-[var(--orange-bg)] px-3 py-2 text-[13px] text-[var(--orange)]">{t.denied}</p>
        )}
        {permission === "unsupported" && (
          <p className="mt-3 rounded-[12px] bg-[var(--fill)] px-3 py-2 text-[13px] text-[var(--label-2)]">{t.unsupported}</p>
        )}
      </div>

      {/* Cosa vuoi ricevere */}
      <div>
        <h3 className="ios-section-header">{t.whatHeader}</h3>
        <div className="ios-group">
          {itemKeys.map((key) => {
            const [title, desc] = t.items[key];
            return (
              <label key={key} className="flex items-center gap-3.5 px-4 py-3">
                <span className="min-w-0 flex-1">
                  <span className="ios-headline block">{title}</span>
                  <span className="ios-footnote block text-[var(--label-2)]">{desc}</span>
                </span>
                <input
                  type="checkbox"
                  checked={prefs[key]}
                  disabled={!active}
                  onChange={(e) => set(key, e.target.checked)}
                  className="disabled:opacity-40"
                />
              </label>
            );
          })}
        </div>
      </div>

      {/* Quando riceverle */}
      <div className="rounded-[22px] bg-card p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="ios-headline">{t.whenTitle}</p>
            <p className="ios-subhead mt-0.5 text-[var(--label-2)]">{t.whenText}</p>
          </div>
          <input
            type="checkbox"
            checked={prefs.quietEnabled}
            disabled={!active}
            onChange={(e) => set("quietEnabled", e.target.checked)}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[14px] text-[var(--label-2)]">
          <span>{t.whenRange}</span>
          <input
            type="time"
            value={prefs.from}
            disabled={!active || !prefs.quietEnabled}
            onChange={(e) => set("from", e.target.value)}
            className="w-[5rem] min-w-0 px-2 py-1.5 text-center text-[14px] tabular-nums disabled:opacity-50 [&::-webkit-calendar-picker-indicator]:hidden"
          />
          <span>{t.whenTo}</span>
          <input
            type="time"
            value={prefs.to}
            disabled={!active || !prefs.quietEnabled}
            onChange={(e) => set("to", e.target.value)}
            className="w-[5rem] min-w-0 px-2 py-1.5 text-center text-[14px] tabular-nums disabled:opacity-50 [&::-webkit-calendar-picker-indicator]:hidden"
          />
        </div>
      </div>

      {/* Notifiche di sistema */}
      <div className="rounded-[22px] bg-card p-4">
        <label className="flex items-center gap-3.5">
          <span className="min-w-0 flex-1">
            <span className="ios-headline block">{t.systemTitle}</span>
            <span className="ios-subhead block text-[var(--label-2)]">{t.systemText}</span>
          </span>
          <input
            type="checkbox"
            checked={prefs.system}
            disabled={!active}
            onChange={(e) => set("system", e.target.checked)}
          />
        </label>
      </div>

      {/* Notifica di prova */}
      <button
        type="button"
        onClick={sendTest}
        disabled={permission === "unsupported" || permission === "denied"}
        className="ui-press flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--tint-soft)] px-4 text-[15px] font-semibold text-[var(--tint)] disabled:opacity-50"
      >
        <IconBell size={18} />
        {sent ? t.testSent : t.test}
      </button>
    </div>
  );
}
