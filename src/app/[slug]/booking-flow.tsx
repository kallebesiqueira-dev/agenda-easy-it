"use client";

/**
 * Flusso pubblico di prenotazione a passi. Mobile-first — il link verrà aperto
 * perlopiù dal WhatsApp/Instagram dell'attività.
 *
 * Il server è l'autorità: questa UI raccoglie solo le scelte; disponibilità e
 * importi vengono sempre ricalcolati in /api/public/*.
 *
 * Oltre ai servizi prenotabili, la pagina mostra i piani/promozioni e i
 * prodotti in vetrina (non prenotabili: si richiedono su WhatsApp o sul posto).
 */

import { useMemo, useState } from "react";
import Image from "next/image";
import type {
  AvailableSlot,
  BookingResult,
  PublicBusinessProfile,
  PublicService,
} from "@/types/database";
import { LanguageSwitcher } from "@/components/language-switcher";
import { formatDateTimeInTz, formatTimeInTz, todayInTz } from "@/lib/dates";
import { intlLocale, type Lang } from "@/lib/i18n";
import { formatEUR } from "@/lib/money";
import { mediaUrl } from "@/lib/storage";

/** Finestra massima di prenotazione futura. Decisione di prodotto: 30 giorni. */
const MAX_ADVANCE_DAYS = 30;

/**
 * Colore del testo sopra il colore del brand: bianco sulle tinte scure, quasi
 * nero su quelle chiare (oro, giallo…). Sceglie il candidato con il contrasto
 * WCAG maggiore rispetto alla luminanza relativa del brand.
 */
function brandInk(hex: string): string {
  const raw = hex.replace("#", "").trim();
  const full =
    raw.length === 3 ? [...raw].map((c) => c + c).join("") : raw;
  if (!/^[0-9a-f]{6}$/i.test(full)) return "#ffffff";
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(full.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.179 ? "#18181b" : "#ffffff";
}

type Step = "service" | "professional" | "datetime" | "details" | "done";

interface DayOption {
  dateISO: string; // AAAA-MM-GG nel fuso dell'attività
  weekdayLabel: string; // "lun"
  dayLabel: string; // "14/10"
}

function buildDayOptions(timezone: string, locale: string): DayOption[] {
  const todayISO = todayInTz(timezone);
  const [y, m, d] = todayISO.split("-").map(Number);
  const days: DayOption[] = [];
  for (let i = 0; i < MAX_ADVANCE_DAYS; i++) {
    const date = new Date(Date.UTC(y, m - 1, d + i, 12));
    const dateISO = date.toISOString().slice(0, 10);
    days.push({
      dateISO,
      weekdayLabel: new Intl.DateTimeFormat(locale, {
        weekday: "short",
        timeZone: "UTC",
      }).format(date),
      dayLabel: new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "2-digit",
        timeZone: "UTC",
      }).format(date),
    });
  }
  return days;
}

interface BookingCopy {
  errors: Record<string, string>;
  genericError: string;
  connError: string;
  onlineBooking: string;
  chooseService: string;
  noServices: string;
  chooseWho: (label: string) => string;
  anyAvailable: string;
  moreSlots: string;
  chooseDateTime: string;
  selectDay: string;
  searching: string;
  noSlots: string;
  yourDetails: string;
  nameLabel: string;
  namePh: string;
  phoneLabel: string;
  phonePh: string;
  emailLabel: string;
  emailOpt: string;
  emailPh: string;
  payOnSite: string;
  bookCta: string;
  bookingCta: string;
  bookedTitle: string;
  bookedHint: string;
  waMessage: (args: { name: string; service: string; when: string }) => string;
  waContact: string;
  unexpected: string;
  cancelThis: string;
  upTo2h: string;
  poweredBy: string;
  backAria: string;
  totalLabel: string;
  plansTitle: string;
  plansAsk: string;
  waPlanMessage: (title: string) => string;
  productsTitle: string;
  productsHint: string;
  waProductMessage: (name: string) => string;
}

const COPY: Record<Lang, BookingCopy> = {
  it: {
    errors: {
      slot_unavailable: "Questo orario è appena stato occupato. Scegline un altro.",
      slot_taken: "Questo orario è appena stato occupato. Scegline un altro.",
      slot_in_past: "Questo orario è già passato. Scegline un altro.",
      invalid_input: "Controlla nome e telefono e riprova.",
    },
    genericError: "Operazione non riuscita. Riprova.",
    connError: "Errore di connessione. Controlla la tua rete e riprova.",
    onlineBooking: "Prenotazioni online",
    chooseService: "Scegli il servizio",
    noServices: "Nessun servizio disponibile al momento.",
    chooseWho: (label) => `Scegli il ${label.toLowerCase()}`,
    anyAvailable: "Qualsiasi disponibile",
    moreSlots: "Più orari liberi",
    chooseDateTime: "Scegli data e orario",
    selectDay: "Seleziona un giorno per vedere gli orari.",
    searching: "Ricerca degli orari…",
    noSlots: "Nessun orario libero in questo giorno. Prova un'altra data.",
    yourDetails: "I tuoi dati",
    nameLabel: "Nome",
    namePh: "Il tuo nome",
    phoneLabel: "WhatsApp / cellulare",
    phonePh: "333 123 4567",
    emailLabel: "E-mail",
    emailOpt: "(opzionale)",
    emailPh: "Per ricevere il promemoria dell'appuntamento",
    payOnSite:
      "Nessun pagamento anticipato: paghi direttamente sul posto, in contanti o con carta.",
    bookCta: "Prenota l'orario",
    bookingCta: "Prenotazione…",
    bookedTitle: "Prenotazione confermata!",
    bookedHint: "Ti aspettiamo. Il pagamento avviene sul posto.",
    waMessage: ({ name, service, when }) =>
      `Ciao! Sono ${name}. Ho appena prenotato ${service} per ${when}.`,
    waContact: "Scrivi all'attività su WhatsApp",
    unexpected: "Imprevisto?",
    cancelThis: "Annulla questa prenotazione",
    upTo2h: "(fino a 2h prima dell'orario).",
    poweredBy: "Prenotazioni con Agenda Easy",
    backAria: "Indietro",
    totalLabel: "Totale:",
    plansTitle: "Piani e promozioni",
    plansAsk: "Richiedi su WhatsApp",
    waPlanMessage: (title) =>
      `Ciao! Ho visto "${title}" sulla vostra pagina e vorrei saperne di più.`,
    productsTitle: "Prodotti",
    productsHint: "Disponibili in negozio — chiedi al tuo appuntamento.",
    waProductMessage: (name) =>
      `Ciao! Ho visto "${name}" sulla vostra pagina e vorrei acquistarlo.`,
  },
  en: {
    errors: {
      slot_unavailable: "This slot was just taken. Please pick another one.",
      slot_taken: "This slot was just taken. Please pick another one.",
      slot_in_past: "This slot has already passed. Please pick another one.",
      invalid_input: "Check your name and phone number and try again.",
    },
    genericError: "Something went wrong. Please try again.",
    connError: "Connection error. Check your network and try again.",
    onlineBooking: "Online bookings",
    chooseService: "Choose a service",
    noServices: "No services available at the moment.",
    chooseWho: () => "Choose a professional",
    anyAvailable: "Any available",
    moreSlots: "More free slots",
    chooseDateTime: "Choose date and time",
    selectDay: "Select a day to see available times.",
    searching: "Looking for available times…",
    noSlots: "No free slots on this day. Try another date.",
    yourDetails: "Your details",
    nameLabel: "Name",
    namePh: "Your name",
    phonePh: "333 123 4567",
    phoneLabel: "WhatsApp / mobile",
    emailLabel: "E-mail",
    emailOpt: "(optional)",
    emailPh: "To receive an appointment reminder",
    payOnSite:
      "No upfront payment: you pay on site, in cash or by card.",
    bookCta: "Book this slot",
    bookingCta: "Booking…",
    bookedTitle: "Booking confirmed!",
    bookedHint: "See you there. Payment happens on site.",
    waMessage: ({ name, service, when }) =>
      `Hi! I'm ${name}. I've just booked ${service} for ${when}.`,
    waContact: "Message the business on WhatsApp",
    unexpected: "Change of plans?",
    cancelThis: "Cancel this booking",
    upTo2h: "(up to 2h before the appointment).",
    poweredBy: "Bookings by Agenda Easy",
    backAria: "Back",
    totalLabel: "Total:",
    plansTitle: "Plans & promotions",
    plansAsk: "Ask on WhatsApp",
    waPlanMessage: (title) =>
      `Hi! I saw "${title}" on your page and I'd like to know more.`,
    productsTitle: "Products",
    productsHint: "Available in store — ask at your appointment.",
    waProductMessage: (name) =>
      `Hi! I saw "${name}" on your page and I'd like to buy it.`,
  },
};

export function BookingFlow({
  profile,
  lang,
}: {
  profile: PublicBusinessProfile;
  lang: Lang;
}) {
  const t = COPY[lang];
  const [step, setStep] = useState<Step>("service");
  const [service, setService] = useState<PublicService | null>(null);
  /** undefined = non ancora scelto; null = "qualsiasi disponibile" */
  const [professionalId, setProfessionalId] = useState<string | null | undefined>();
  const [dateISO, setDateISO] = useState<string | null>(null);
  const [slots, setSlots] = useState<AvailableSlot[] | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BookingResult | null>(null);

  const dayOptions = useMemo(
    () => buildDayOptions(profile.timezone, intlLocale(lang)),
    [profile.timezone, lang]
  );

  /** Chiamato nei handler (clic sul giorno / retry), mai negli effetti. */
  async function loadSlots(date: string, forProfessionalId = professionalId) {
    if (!service) return;
    setSlotsLoading(true);
    setSlots(null);
    setSelectedSlot(null);
    try {
      const params = new URLSearchParams({
        business_slug: profile.slug,
        service_id: service.id,
        date,
      });
      if (forProfessionalId) params.set("professional_id", forProfessionalId);
      const res = await fetch(`/api/public/availability?${params}`);
      const json = await res.json();
      setSlots(res.ok ? json.slots : []);
    } catch {
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }

  /** Reset al cambio di servizio/professionista: gli slot vecchi diventano invalidi. */
  function resetDateSelection() {
    setDateISO(null);
    setSlots(null);
    setSelectedSlot(null);
  }

  // Slot deduplicati per orario (più professionisti liberi nello stesso
  // orario diventano un'unica opzione con "qualsiasi disponibile").
  const timeOptions = useMemo(() => {
    if (!slots) return [];
    const seen = new Map<string, AvailableSlot>();
    for (const s of slots) {
      if (!seen.has(s.starts_at)) seen.set(s.starts_at, s);
    }
    return [...seen.values()];
  }, [slots]);

  async function submit() {
    if (!service || !dateISO || !selectedSlot) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/public/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_slug: profile.slug,
          service_id: service.id,
          professional_id: professionalId ?? null,
          date: dateISO,
          start_time: formatTimeInTz(selectedSlot.starts_at, profile.timezone),
          customer_name: name,
          customer_phone: phone,
          customer_email: email.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        const message = t.errors[json.error] ?? t.genericError;
        setError(message);
        if (json.error === "slot_unavailable" || json.error === "slot_taken") {
          setStep("datetime");
          if (dateISO) loadSlots(dateISO);
        }
        return;
      }
      setResult(json.booking);
      setStep("done");
    } catch {
      setError(t.connError);
    } finally {
      setSubmitting(false);
    }
  }

  const brandStyle = {
    "--brand": profile.brand_primary,
    "--brand-ink": brandInk(profile.brand_primary),
  } as React.CSSProperties;
  const waNumber = profile.whatsapp
    ? `39${profile.whatsapp.replace(/\D/g, "")}`
    : null;

  return (
    <div style={brandStyle} className="min-h-dvh bg-zinc-100 text-zinc-900">
      {/* Header in stile profilo: banner pulito, avatar a cavallo del bordo,
          nome e indirizzo su fondo bianco (niente testo sopra la foto). */}
      <header className="bg-white shadow-sm">
        <div className="relative h-36 overflow-hidden bg-[var(--brand)] sm:h-48">
          {profile.cover_path ? (
            <Image
              src={mediaUrl(profile.cover_path)!}
              alt=""
              aria-hidden
              fill
              priority
              sizes="100vw"
              className="object-cover"
              style={{ objectPosition: `50% ${profile.cover_position}%` }}
            />
          ) : (
            // bagliore decorativo sopra il colore del brand
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(60% 120% at 85% -20%, rgba(255,255,255,0.25), transparent 60%), radial-gradient(40% 80% at 0% 100%, rgba(0,0,0,0.18), transparent 60%)",
              }}
            />
          )}
          <div className="absolute right-4 top-4 z-10">
            <LanguageSwitcher current={lang} variant="dark" />
          </div>
        </div>

        <div className="mx-auto w-full max-w-md px-4 pb-5 sm:max-w-lg lg:max-w-xl">
          <div className="-mt-10 flex items-end justify-between gap-3 sm:-mt-12">
            {profile.logo_path ? (
              <Image
                src={mediaUrl(profile.logo_path)!}
                alt={profile.name}
                width={96}
                height={96}
                className="size-20 shrink-0 rounded-full border-4 border-white bg-white object-cover shadow-md sm:size-24"
              />
            ) : (
              <div className="flex size-20 shrink-0 items-center justify-center rounded-full border-4 border-white bg-[var(--brand)] text-3xl font-bold text-[var(--brand-ink)] shadow-md sm:size-24">
                {profile.name.charAt(0).toUpperCase()}
              </div>
            )}
            {/* pill solido: deve restare leggibile anche sopra la foto di copertina */}
            <span className="rounded-full bg-[var(--brand)] px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--brand-ink)] shadow-sm">
              {t.onlineBooking}
            </span>
          </div>
          <h1 className="mt-3 truncate text-2xl font-bold sm:text-3xl">
            {profile.name}
          </h1>
          {profile.address && (
            <p className="mt-1 truncate text-sm text-zinc-500">{profile.address}</p>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-4 pb-16 pt-5 sm:max-w-lg lg:max-w-xl">
        <div className="rounded-3xl bg-white p-5 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.35)] ring-1 ring-black/5 sm:p-7">
          {step === "service" && (
            <StepShell title={t.chooseService}>
              <ul className="space-y-2.5">
                {profile.services.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setService(s);
                        resetDateSelection();
                        setStep(
                          profile.professionals.length > 1 ? "professional" : "datetime"
                        );
                        if (profile.professionals.length === 1) {
                          setProfessionalId(profile.professionals[0].id);
                        }
                      }}
                      className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-zinc-200 px-4 py-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--brand)] hover:shadow-md"
                    >
                      {s.image_path && (
                        <Image
                          src={mediaUrl(s.image_path)!}
                          alt=""
                          width={56}
                          height={56}
                          className="size-14 shrink-0 rounded-xl object-cover"
                        />
                      )}
                      <span className="flex-1">
                        <span className="block text-lg font-semibold text-zinc-900">
                          {s.name}
                        </span>
                        <span className="block text-sm text-zinc-500">
                          {s.duration_minutes} min
                          {s.description ? ` · ${s.description}` : ""}
                        </span>
                      </span>
                      <span className="shrink-0 rounded-full bg-zinc-100 px-3 py-1.5 text-sm font-semibold transition-colors group-hover:bg-[var(--brand)] group-hover:text-[var(--brand-ink)]">
                        {formatEUR(s.price_minor)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {profile.services.length === 0 && (
                <p className="py-6 text-center text-sm text-zinc-500">
                  {t.noServices}
                </p>
              )}

              {profile.plans.length > 0 && (
                <section className="mt-6">
                  <h3 className="mb-2.5 font-semibold">{t.plansTitle}</h3>
                  <ul className="space-y-2.5">
                    {profile.plans.map((p) => (
                      <li
                        key={p.id}
                        className="rounded-2xl border border-zinc-200 bg-zinc-50/60 px-4 py-3.5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            {p.badge && (
                              <span className="mb-1 inline-block rounded-full bg-[var(--brand)] px-2.5 py-0.5 text-xs font-semibold text-[var(--brand-ink)]">
                                {p.badge}
                              </span>
                            )}
                            <p className="font-semibold text-zinc-900">{p.title}</p>
                          </div>
                          {p.price_minor !== null && (
                            <p className="shrink-0 text-right font-semibold">
                              {formatEUR(p.price_minor)}
                              {p.price_suffix && (
                                <span className="text-sm font-normal text-zinc-500">
                                  {" "}
                                  {p.price_suffix}
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                        {p.description && (
                          <p className="mt-1 text-sm text-zinc-600">{p.description}</p>
                        )}
                        {waNumber && (
                          <a
                            href={`https://wa.me/${waNumber}?text=${encodeURIComponent(
                              t.waPlanMessage(p.title)
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-block text-sm font-semibold text-[var(--brand)] underline"
                          >
                            {t.plansAsk}
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {profile.products.length > 0 && (
                <section className="mt-6">
                  <h3 className="mb-1 font-semibold">{t.productsTitle}</h3>
                  <p className="mb-2.5 text-xs text-zinc-500">{t.productsHint}</p>
                  <ul className="grid gap-2.5 sm:grid-cols-2">
                    {profile.products.map((p) => (
                      <li
                        key={p.id}
                        className="rounded-2xl border border-zinc-200 px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          {p.image_path && (
                            <Image
                              src={mediaUrl(p.image_path)!}
                              alt=""
                              width={48}
                              height={48}
                              className="size-12 shrink-0 rounded-xl object-cover"
                            />
                          )}
                          <span className="min-w-0 flex-1">
                            <span className="block font-medium text-zinc-900">
                              {p.name}
                            </span>
                            {p.description && (
                              <span className="block text-sm text-zinc-500">
                                {p.description}
                              </span>
                            )}
                          </span>
                          <span className="shrink-0 rounded-full bg-zinc-100 px-3 py-1.5 text-sm font-semibold">
                            {formatEUR(p.price_minor)}
                          </span>
                        </div>
                        {waNumber && (
                          <a
                            href={`https://wa.me/${waNumber}?text=${encodeURIComponent(
                              t.waProductMessage(p.name)
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-block text-sm font-semibold text-[var(--brand)] underline"
                          >
                            {t.plansAsk}
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </StepShell>
          )}

          {step === "professional" && service && (
            <StepShell
              title={t.chooseWho(profile.professional_label)}
              backLabel={t.backAria}
              onBack={() => setStep("service")}
            >
              <ul className="space-y-2">
                <li>
                  <ChoiceButton
                    label={t.anyAvailable}
                    sublabel={t.moreSlots}
                    onClick={() => {
                      setProfessionalId(null);
                      resetDateSelection();
                      setStep("datetime");
                    }}
                  />
                </li>
                {profile.professionals.map((p) => (
                  <li key={p.id}>
                    <ChoiceButton
                      label={p.display_name}
                      imageUrl={mediaUrl(p.image_path)}
                      onClick={() => {
                        setProfessionalId(p.id);
                        resetDateSelection();
                        setStep("datetime");
                      }}
                    />
                  </li>
                ))}
              </ul>
            </StepShell>
          )}

          {step === "datetime" && service && (
            <StepShell
              title={t.chooseDateTime}
              backLabel={t.backAria}
              onBack={() =>
                setStep(profile.professionals.length > 1 ? "professional" : "service")
              }
            >
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
                {dayOptions.map((d) => (
                  <button
                    key={d.dateISO}
                    type="button"
                    onClick={() => {
                      setDateISO(d.dateISO);
                      loadSlots(d.dateISO);
                    }}
                    className={`flex w-14 shrink-0 flex-col items-center rounded-2xl border py-2.5 text-sm transition-all sm:w-16 ${
                      dateISO === d.dateISO
                        ? "border-transparent bg-[var(--brand)] text-[var(--brand-ink)] shadow-md"
                        : "border-zinc-200 bg-white text-zinc-700 hover:border-[var(--brand)]"
                    }`}
                  >
                    <span className="capitalize">{d.weekdayLabel.replace(".", "")}</span>
                    <span className="font-semibold">{d.dayLabel}</span>
                  </button>
                ))}
              </div>

              {!dateISO && (
                <p className="py-6 text-center text-sm text-zinc-500">
                  {t.selectDay}
                </p>
              )}
              {dateISO && slotsLoading && (
                <p className="py-6 text-center text-sm text-zinc-500">
                  {t.searching}
                </p>
              )}
              {dateISO && !slotsLoading && slots && timeOptions.length === 0 && (
                <p className="py-6 text-center text-sm text-zinc-500">
                  {t.noSlots}
                </p>
              )}
              {dateISO && !slotsLoading && timeOptions.length > 0 && (
                <div className="grid grid-cols-4 gap-2 pt-2 sm:grid-cols-5 lg:grid-cols-6">
                  {timeOptions.map((slot) => (
                    <button
                      key={slot.starts_at}
                      type="button"
                      onClick={() => {
                        setSelectedSlot(slot);
                        setStep("details");
                      }}
                      className="rounded-xl border border-zinc-200 py-2.5 text-sm font-medium transition-all hover:-translate-y-0.5 hover:border-[var(--brand)] hover:text-[var(--brand)] hover:shadow-sm"
                    >
                      {formatTimeInTz(slot.starts_at, profile.timezone)}
                    </button>
                  ))}
                </div>
              )}
            </StepShell>
          )}

          {step === "details" && service && selectedSlot && (
            <StepShell
              title={t.yourDetails}
              backLabel={t.backAria}
              onBack={() => setStep("datetime")}
            >
              <Summary
                serviceName={service.name}
                when={formatDateTimeInTz(
                  selectedSlot.starts_at,
                  profile.timezone,
                  lang
                )}
                priceMinor={service.price_minor}
                t={t}
              />
              <form
                className="mt-4 space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  submit();
                }}
              >
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">
                    {t.nameLabel}
                  </span>
                  <input
                    required
                    minLength={2}
                    maxLength={80}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-[var(--brand)]"
                    placeholder={t.namePh}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">
                    {t.phoneLabel}
                  </span>
                  <input
                    required
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-[var(--brand)]"
                    placeholder={t.phonePh}
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium">
                    {t.emailLabel}{" "}
                    <span className="text-zinc-400">{t.emailOpt}</span>
                  </span>
                  <input
                    type="email"
                    maxLength={120}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-[var(--brand)]"
                    placeholder={t.emailPh}
                  />
                </label>

                <p className="rounded-xl bg-zinc-50 px-3 py-2.5 text-sm text-zinc-600">
                  {t.payOnSite}
                </p>

                {error && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-[var(--brand)] py-3 font-semibold text-[var(--brand-ink)] disabled:opacity-60"
                >
                  {submitting ? t.bookingCta : t.bookCta}
                </button>
              </form>
            </StepShell>
          )}

          {step === "done" && service && result && (
            <div className="py-2 text-center">
              <p className="text-3xl">✅</p>
              <h2 className="mt-2 text-lg font-bold">{t.bookedTitle}</h2>
              <p className="mt-1 text-sm text-zinc-600">
                {service.name} ·{" "}
                {formatDateTimeInTz(result.starts_at, profile.timezone, lang)}
              </p>

              <div className="mt-4 rounded-xl bg-zinc-50 p-4 text-left text-sm">
                <p className="font-semibold">
                  {t.totalLabel} {formatEUR(result.service_price_minor)}
                </p>
                <p className="mt-1 text-zinc-600">{t.bookedHint}</p>
              </div>

              {waNumber && (
                <a
                  href={`https://wa.me/${waNumber}?text=${encodeURIComponent(
                    t.waMessage({
                      name,
                      service: service.name,
                      when: formatDateTimeInTz(
                        result.starts_at,
                        profile.timezone,
                        lang
                      ),
                    })
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 block w-full rounded-xl bg-[#25D366] py-3 font-semibold text-white"
                >
                  {t.waContact}
                </a>
              )}

              {result.cancel_token && (
                <p className="mt-4 text-xs text-zinc-400">
                  {t.unexpected}{" "}
                  <a
                    href={`/annulla/${result.appointment_id}?t=${result.cancel_token}`}
                    className="underline"
                  >
                    {t.cancelThis}
                  </a>{" "}
                  {t.upTo2h}
                </p>
              )}
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-zinc-400">
          {t.poweredBy}
        </p>
      </main>
    </div>
  );
}

function StepShell({
  title,
  onBack,
  backLabel = "Indietro",
  children,
}: {
  title: string;
  onBack?: () => void;
  backLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label={backLabel}
            className="rounded-lg px-2 py-1 text-zinc-500 hover:bg-zinc-100"
          >
            ←
          </button>
        )}
        <h2 className="font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function ChoiceButton({
  label,
  sublabel,
  imageUrl,
  onClick,
}: {
  label: string;
  sublabel?: string;
  imageUrl?: string | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--brand)] hover:shadow-md"
    >
      {imageUrl && (
        <Image
          src={imageUrl}
          alt=""
          width={44}
          height={44}
          className="size-11 shrink-0 rounded-full object-cover"
        />
      )}
      <span>
        <span className="block font-medium">{label}</span>
        {sublabel && (
          <span className="block text-sm text-zinc-500">{sublabel}</span>
        )}
      </span>
    </button>
  );
}

function Summary({
  serviceName,
  when,
  priceMinor,
  t,
}: {
  serviceName: string;
  when: string;
  priceMinor: number;
  t: BookingCopy;
}) {
  return (
    <div className="rounded-xl bg-zinc-50 p-3 text-sm">
      <p className="font-medium">{serviceName}</p>
      <p className="text-zinc-600">{when}</p>
      <p className="mt-1 text-zinc-600">
        {t.totalLabel} <strong>{formatEUR(priceMinor)}</strong>
      </p>
    </div>
  );
}
