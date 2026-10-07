/**
 * Landing pubblica di Agenda Easy.
 *
 * Tutta la copy riflette il prodotto reale: pagina pubblica /{slug}, acconto del 50%,
 * Piano Unico (PLAN) e prova gratuita (TRIAL_DAYS). Se la politica di
 * prezzo/prova cambia in src/lib/billing, questa pagina si aggiorna da sola.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { Fraunces, Instrument_Sans } from "next/font/google";
import { ScrollBubbles } from "@/components/scroll-bubbles";
import { SupportChat } from "@/components/support-chat";
import { PLAN, TRIAL_DAYS } from "@/lib/billing";
import { formatEUR } from "@/lib/money";

const display = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz", "SOFT", "WONK"],
  variable: "--font-landing-display",
});

const sans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-landing-sans",
});

export const metadata: Metadata = {
  title: "Agenda Easy — Agenda piena, WhatsApp in pace",
};

const SEGMENTS = [
  "Saloni di bellezza",
  "Barberie",
  "Cliniche",
  "Onicotecniche",
  "Tatuatori",
  "Fisioterapisti",
  "Dentisti",
  "Toelettature",
  "Personal trainer",
  "Insegnanti privati",
  "Studi medici",
  "Studi professionali",
  "E qualsiasi servizio su appuntamento",
];

const STEPS = [
  {
    title: "Crea il tuo account",
    body: `Registra la tua attività, i tuoi servizi (prezzo, durata, foto) e gli orari di apertura. Ci vogliono meno di dieci minuti — e i primi ${TRIAL_DAYS} giorni li offriamo noi.`,
  },
  {
    title: "Condividi il tuo link",
    body: "Ottieni una pagina pubblica con l'indirizzo della tua attività. Incollala su Instagram, su WhatsApp, ovunque siano i tuoi clienti. Scelgono servizio, professionista e orario da soli.",
  },
  {
    title: "Ricevi l'acconto, conferma l'appuntamento",
    body: "Per prenotare, il cliente versa un acconto del 50% del servizio. Chi ha pagato, si presenta. L'agenda del giorno resta organizzata nel pannello, senza scambi infiniti di messaggi.",
  },
];

const FEATURES = [
  {
    title: "Pagina di prenotazione con il tuo stile",
    body: "Nome, descrizione e servizi con foto in un link pubblico tutto tuo. Il cliente prenota senza scaricare app e senza creare un account.",
  },
  {
    title: "Acconto del 50% contro i no-show",
    body: "La prenotazione vale solo dopo che il cliente ha pagato metà del valore del servizio. Basta bloccare orari per chi poi non si presenta.",
  },
  {
    title: "Agenda del giorno nel pannello",
    body: "Vedi chi arriva oggi, a che ora, quale servizio e quanto è già stato versato di acconto — tutto in un'unica schermata.",
  },
  {
    title: "Team e orari per professionista",
    body: "Registra ogni professionista del tuo team e lascia che il cliente scelga da chi farsi seguire.",
  },
  {
    title: "Servizi a modo tuo",
    body: "Prezzo, durata e foto di ogni servizio. La durata di ogni appuntamento viene rispettata automaticamente nella griglia degli orari.",
  },
  {
    title: "Orari di apertura reali",
    body: "Definisci i giorni e le fasce orarie della tua attività. Al cliente appaiono solo gli orari che esistono davvero.",
  },
];

const PLAN_BULLETS = [
  "Pagina pubblica di prenotazione",
  "Prenotazioni e acconti del 50% illimitati",
  "Servizi, team e orari senza limiti",
  `${TRIAL_DAYS} giorni gratis, senza carta di credito`,
  "Disdici quando vuoi",
];

export default function LandingPage() {
  return (
    <div
      className={`${display.variable} ${sans.variable} min-h-dvh bg-[#f6f1e7] font-[family-name:var(--font-landing-sans)] text-[#221c15]`}
    >
      {/* texture carta leggera */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(#221c15 0.5px, transparent 0.5px)",
          backgroundSize: "22px 22px",
          maskImage:
            "linear-gradient(to bottom, transparent, black 30%, transparent)",
        }}
      />

      <header className="sticky top-0 z-40 border-b border-[#221c15]/5 bg-[#f6f1e7]/85 px-5 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between py-4">
        <p className="font-[family-name:var(--font-landing-display)] text-xl font-semibold tracking-tight">
          agenda<span className="italic text-[#17493b]">easy</span>
          <span className="text-[#e4572e]">.</span>
        </p>
        <nav className="flex items-center gap-2 text-sm font-medium sm:gap-5">
          <a href="#come-funziona" className="hidden hover:underline sm:block">
            Come funziona
          </a>
          <a href="#prezzo" className="hidden hover:underline sm:block">
            Prezzo
          </a>
          <Link href="/login" className="px-2 py-2 hover:underline">
            Accedi
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-[#221c15] px-4 py-2 text-[#f6f1e7] transition-colors hover:bg-[#17493b]"
          >
            Crea account
          </Link>
        </nav>
        </div>
      </header>

      <ScrollBubbles />

      {/* ---------------- Hero ---------------- */}
      <section className="relative mx-auto grid w-full max-w-6xl gap-12 px-5 pb-20 pt-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pt-16">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/home.png"
            alt="Agenda Easy — prenotazioni online"
            className="landing-rise w-full"
          />
          <div
            className="landing-rise mt-8 flex flex-wrap items-center gap-4"
            style={{ animationDelay: "160ms" }}
          >
            <Link
              href="/signup"
              className="rounded-full bg-[#e4572e] px-7 py-3.5 text-base font-semibold text-white shadow-[0_8px_24px_-8px_rgba(228,87,46,0.6)] transition-transform hover:-translate-y-0.5"
            >
              Inizia gratis per {TRIAL_DAYS} giorni
            </Link>
            <p className="text-sm text-[#221c15]/60">
              Nessuna carta di credito
              <br className="sm:hidden" /> alla registrazione.
            </p>
          </div>
        </div>

        {/* Mock della pagina pubblica di prenotazione */}
        <div
          aria-hidden
          className="landing-rise relative mx-auto w-full max-w-sm"
          style={{ animationDelay: "320ms" }}
        >
          <div className="absolute -inset-6 rounded-[2rem] bg-[#17493b]/10 [transform:rotate(-2deg)]" />
          <div className="relative rounded-3xl border border-[#221c15]/10 bg-white p-5 shadow-[0_24px_60px_-24px_rgba(34,28,21,0.35)]">
            <p className="inline-block rounded-full bg-[#f6f1e7] px-3 py-1 font-mono text-xs text-[#221c15]/70">
              agendaeasy.it/studio-anna
            </p>
            <p className="mt-4 font-[family-name:var(--font-landing-display)] text-lg font-semibold">
              Studio Anna — Bellezza &amp; Estetica
            </p>
            <div className="mt-3 space-y-2">
              {[
                ["Taglio + piega", "1h", "45,00 €"],
                ["Colore", "2h", "90,00 €"],
                ["Manicure", "45min", "25,00 €"],
              ].map(([name, duration, price]) => (
                <div
                  key={name}
                  className="flex items-center justify-between rounded-xl border border-[#221c15]/10 px-3 py-2.5 text-sm first:border-[#17493b] first:bg-[#17493b]/5"
                >
                  <span className="font-medium">{name}</span>
                  <span className="text-[#221c15]/50">
                    {duration} · {price}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[#221c15]/50">
              Orari di domani
            </p>
            <div className="mt-2 grid grid-cols-4 gap-2 text-center text-sm">
              {["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"].map(
                (t, i) => (
                  <span
                    key={t}
                    className={`rounded-lg border px-2 py-1.5 ${
                      i === 3
                        ? "border-[#e4572e] bg-[#e4572e] font-semibold text-white"
                        : "border-[#221c15]/10"
                    }`}
                  >
                    {t}
                  </span>
                )
              )}
            </div>
            <div className="mt-4 rounded-xl bg-[#221c15] px-4 py-3 text-center text-sm font-semibold text-[#f6f1e7]">
              Prenota con acconto di 22,50 €
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Marquee dei segmenti ---------------- */}
      <div className="relative overflow-hidden border-y border-[#221c15]/10 bg-[#17493b] py-3 text-[#f6f1e7]">
        <div className="landing-marquee flex w-max">
          {[0, 1].map((copy) => (
            <div
              key={copy}
              className="flex shrink-0 items-center text-sm font-medium uppercase tracking-[0.18em]"
            >
              {SEGMENTS.map((s) => (
                <span key={s} className="flex items-center">
                  <span className="px-5">{s}</span>
                  <span className="text-[#e4572e]">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ---------------- Come funziona ---------------- */}
      <section
        id="come-funziona"
        className="relative mx-auto w-full max-w-6xl px-5 py-24"
      >
        <h2
          data-bubble
          className="text-center font-[family-name:var(--font-landing-display)] text-4xl font-semibold tracking-tight sm:text-5xl"
        >
          Dalla registrazione alla prima
          <br />
          prenotazione <em className="text-[#e4572e]">in un giorno.</em>
        </h2>
        <div className="mt-12 grid gap-10 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <div key={step.title} data-bubble className="relative">
              <p className="font-[family-name:var(--font-landing-display)] text-6xl font-semibold italic text-[#17493b]/20">
                {i + 1}
              </p>
              <h3 className="mt-2 text-xl font-semibold">{step.title}</h3>
              <p className="mt-2 leading-relaxed text-[#221c15]/70">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- Funzionalità ---------------- */}
      <section className="relative border-y border-[#221c15]/10 bg-[#fffdf8]">
        <div className="mx-auto w-full max-w-6xl px-5 py-24">
          <h2
            data-bubble
            className="text-center font-[family-name:var(--font-landing-display)] text-4xl font-semibold tracking-tight sm:text-5xl"
          >
            Tutto quello che fa la reception,
            <br />
            <em className="text-[#17493b]">senza bisogno della reception.</em>
          </h2>
          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-[#221c15]/10 bg-[#221c15]/10 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                data-bubble
                className="bg-[#fffdf8] p-7 transition-colors hover:bg-[#f6f1e7]"
              >
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#221c15]/70">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Prezzo ---------------- */}
      <section id="prezzo" className="relative mx-auto w-full max-w-6xl px-5 py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div data-bubble>
            <h2 className="font-[family-name:var(--font-landing-display)] text-4xl font-semibold tracking-tight sm:text-5xl">
              Un solo piano.
              <br />
              <em className="text-[#e4572e]">Tutto incluso.</em>
            </h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-[#221c15]/70">
              Niente scalini di piano, niente funzioni bloccate, niente sorprese
              in fattura. Un solo acconto del 50% in più al mese ripaga già
              l&apos;abbonamento.
            </p>
          </div>
          <div data-bubble className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-[#e4572e]/10 [transform:rotate(1.5deg)]" />
            <div className="relative rounded-3xl border border-[#221c15]/10 bg-white p-8 shadow-[0_24px_60px_-24px_rgba(34,28,21,0.3)]">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#17493b]">
                {PLAN.name}
              </p>
              <p className="mt-3 font-[family-name:var(--font-landing-display)] text-5xl font-semibold tracking-tight">
                {formatEUR(PLAN.priceMinor)}
                <span className="text-xl font-normal text-[#221c15]/50">
                  {" "}
                  /mese
                </span>
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                {PLAN_BULLETS.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="mt-0.5 text-[#e4572e]">✦</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="mt-8 block rounded-full bg-[#221c15] py-3.5 text-center font-semibold text-[#f6f1e7] transition-colors hover:bg-[#17493b]"
              >
                Prova gratis per {TRIAL_DAYS} giorni
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- CTA finale ---------------- */}
      <section className="relative overflow-hidden bg-[#17493b] text-[#f6f1e7]">
        <div data-bubble className="mx-auto w-full max-w-6xl px-5 py-24 text-center">
          <h2 className="mx-auto max-w-2xl font-[family-name:var(--font-landing-display)] text-4xl font-semibold tracking-tight sm:text-5xl">
            Mentre tu lavori,
            <br />
            <em className="text-[#e4572e]">la tua pagina prenota.</em>
          </h2>
          <Link
            href="/signup"
            className="mt-10 inline-block rounded-full bg-[#e4572e] px-8 py-4 text-lg font-semibold text-white transition-transform hover:-translate-y-0.5"
          >
            Crea la mia pagina di prenotazione
          </Link>
          <p className="mt-4 text-sm text-[#f6f1e7]/60">
            {TRIAL_DAYS} giorni gratis · {formatEUR(PLAN.priceMinor)}/mese dopo ·
            disdici quando vuoi
          </p>
        </div>
      </section>

      <footer className="relative bg-[#12130f] px-5 py-8 text-sm text-[#f6f1e7]/50">
        <div className="mx-auto w-full max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="font-[family-name:var(--font-landing-display)] text-lg text-[#f6f1e7]">
              agenda<span className="italic">easy</span>
              <span className="text-[#e4572e]">.</span>
            </p>
            <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              <Link href="/login" className="hover:text-[#f6f1e7]">
                Accedi
              </Link>
              <Link href="/signup" className="hover:text-[#f6f1e7]">
                Crea account
              </Link>
              <Link href="/termini" className="hover:text-[#f6f1e7]">
                Termini
              </Link>
              <Link href="/privacy" className="hover:text-[#f6f1e7]">
                Privacy
              </Link>
            </nav>
          </div>
          <p className="mt-6 border-t border-[#f6f1e7]/10 pt-5 text-center text-xs">
            © {new Date().getFullYear()} Agenda Easy · Sviluppato da{" "}
            <a
              href="https://digitalpauloafonso.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#f6f1e7] hover:underline"
            >
              Digital Paulo Afonso
            </a>
          </p>
        </div>
      </footer>

      <SupportChat />
    </div>
  );
}
