/**
 * Landing pubblica di Agenda Easy — bilingue (it/en, cookie `lang`).
 *
 * Tutta la copy riflette il prodotto reale: pagina pubblica /{slug},
 * agenda nel pannello, conferma e promemoria via e-mail (con link WhatsApp
 * dell'attività), report mensile, Piano Unico (PLAN) e prova (TRIAL_DAYS).
 */
import type { Metadata } from "next";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/language-switcher";
import { SupportChat } from "@/components/support-chat";
import { AccentPicker } from "@/components/landing/accent-picker";
import { SegmentDemo } from "@/components/landing/segment-demo";
import { PromoVideo } from "@/components/landing/promo-video";
import { LandingMotion } from "@/components/landing/landing-motion";
import { ApptRow, GlassCard, Mac, MiniAgenda, Monogram, Phone, type Appt } from "@/components/landing/app-mock";
import { IconCalendar, IconChart, IconCheck, IconUsers } from "@/components/icons";
import { PLAN, TRIAL_DAYS } from "@/lib/billing";
import { type Lang } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { formatEUR } from "@/lib/money";

export const metadata: Metadata = {
  title: "Agenda Easy · La tua agenda. Finalmente semplice.",
};

const price = formatEUR(PLAN.priceMinor);

const COPY = {
  it: {
    video: { kicker: "Il video", t: "Agenda Easy in 48 secondi.", b: "Prenotazioni online, promemoria automatici e un'agenda sempre in ordine. Guarda come funziona.", label: "Video di presentazione di Agenda Easy", play: "Guarda il video" },
    nav: { story: "Come funziona", who: "Per chi è", price: "Prezzo", signIn: "Accedi", signUp: "Crea account" },
    hero: ["La tua agenda.", "Finalmente semplice."],
    heroSub: "Una pagina di prenotazione tutta tua, l'agenda che si riempie da sola e promemoria automatici per i clienti. Senza app da scaricare.",
    heroCta: `Inizia gratis per ${TRIAL_DAYS} giorni`,
    heroNote: "Nessuna carta di credito alla registrazione.",
    today: "Oggi",
    studio: "Studio Anna",
    appts: [
      { time: "09:30", end: "10:30", name: "Sara Bianchi", service: "Taglio + piega", price: "45,00 €", status: "Confermata", tone: "tint" },
      { time: "11:00", end: "13:00", name: "Luca Moretti", service: "Colore", price: "90,00 €", status: "Confermata", tone: "tint" },
      { time: "14:30", end: "15:15", name: "Elena Galli", service: "Manicure", price: "25,00 €", status: "Completata", tone: "blue" },
    ] as Appt[],
    newAppt: { time: "16:00", end: "17:00", name: "Giulia Conti", service: "Taglio + piega", price: "45,00 €", status: "Confermata", tone: "tint" } as Appt,
    storyKicker: "Come funziona",
    story: [
      { k: "01", t: "Un appuntamento entra in agenda.", b: "Ogni prenotazione arriva già confermata nel pannello: chi, quando, quale servizio e con quale professionista. Tu apri l'agenda del giorno e lavori." },
      { k: "02", t: "Il cliente prenota dal tuo link.", b: "Condividi la tua pagina su Instagram o WhatsApp. Il cliente sceglie servizio, professionista e orario da solo, senza account e senza app." },
      { k: "03", t: "Il promemoria arriva da solo.", b: "Conferma e promemoria via e-mail, con il pulsante per scriverti su WhatsApp e il link per annullare. Meno buchi in agenda, zero messaggi da inviare a mano." },
      { k: "04", t: "Il report si compila da sé.", b: "Ricavi previsti, prenotazioni completate, annullate e non presentate: il mese in un colpo d'occhio, con i servizi più richiesti." },
    ],
    booking: { title: "Prenota", services: [["Taglio + piega", "1h", "45,00 €"], ["Colore", "2h", "90,00 €"], ["Manicure", "45min", "25,00 €"]], slots: ["10:00", "11:30", "14:00", "16:00"], cta: "Prenota alle 16:00" },
    mail: { from: "Studio Anna", subject: "Promemoria: domani alle 16:00", body: "Ciao Giulia, ti aspettiamo domani alle 16:00 per Taglio + piega.", wa: "Scrivici su WhatsApp", cancel: "Annulla" },
    report: { title: "Report · Novembre", revenue: "Ricavi previsti", done: "Completate", total: "Prenotazioni", noShow: "Non presentati" },
    picker: { kicker: "Il tuo colore", t: "Il tuo brand, in tutta l'app.", b: "Scegli il colore della tua attività nelle impostazioni: pulsanti, agenda e pagina di prenotazione si adattano. Provalo qui.", label: "Colore del brand", custom: "Colore personalizzato" },
    who: { kicker: "Per chi è", t: "Per chi lavora su appuntamento." },
    pending: "In attesa",
    segments: [
      { name: "Parrucchieri", studio: "Salone Marta", accent: "#5fae8a", service: "Taglio + piega" },
      { name: "Estetiste", studio: "Beauty Lab", accent: "#e48aa6", service: "Pulizia viso" },
      { name: "Studi professionali", studio: "Studio Ferri", accent: "#2f6fe0", service: "Consulenza" },
      { name: "Personal trainer", studio: "Move Club", accent: "#ff7f61", service: "Allenamento 1:1" },
    ],
    priceK: "Prezzo",
    priceT: ["Un solo piano.", "Tutto incluso."],
    plan: "Piano Unico",
    perMonth: "/mese",
    bullets: ["Pagina pubblica di prenotazione", "Prenotazioni illimitate", "Servizi, prodotti, piani e team senza limiti", "Promemoria e-mail automatici", `${TRIAL_DAYS} giorni gratis, senza carta`, "Disdici quando vuoi"],
    priceCta: `Prova gratis per ${TRIAL_DAYS} giorni`,
    final: ["Mentre tu lavori,", "la tua pagina prenota."],
    finalCta: "Crea la mia pagina",
    finalNote: `${TRIAL_DAYS} giorni gratis · ${price}/mese dopo · disdici quando vuoi`,
    footer: { terms: "Termini", privacy: "Privacy", by: "Sviluppato da" },
  },
  en: {
    video: { kicker: "The video", t: "Agenda Easy in 48 seconds.", b: "Online bookings, automatic reminders and a calendar that stays in order. See how it works.", label: "Agenda Easy promo video", play: "Watch the video" },
    nav: { story: "How it works", who: "Who it's for", price: "Pricing", signIn: "Sign in", signUp: "Create account" },
    hero: ["Your calendar.", "Finally simple."],
    heroSub: "A booking page of your own, a calendar that fills itself and automatic reminders for your clients. No app to download.",
    heroCta: `Start free for ${TRIAL_DAYS} days`,
    heroNote: "No credit card required to sign up.",
    today: "Today",
    studio: "Studio Anna",
    appts: [
      { time: "09:30", end: "10:30", name: "Sara Bianchi", service: "Cut + blow-dry", price: "€45.00", status: "Confirmed", tone: "tint" },
      { time: "11:00", end: "13:00", name: "Luca Moretti", service: "Colour", price: "€90.00", status: "Confirmed", tone: "tint" },
      { time: "14:30", end: "15:15", name: "Elena Galli", service: "Manicure", price: "€25.00", status: "Completed", tone: "blue" },
    ] as Appt[],
    newAppt: { time: "16:00", end: "17:00", name: "Giulia Conti", service: "Cut + blow-dry", price: "€45.00", status: "Confirmed", tone: "tint" } as Appt,
    storyKicker: "How it works",
    story: [
      { k: "01", t: "A booking lands in your calendar.", b: "Every booking arrives already confirmed in your dashboard: who, when, which service and with whom. You open today's agenda and get to work." },
      { k: "02", t: "Clients book from your link.", b: "Share your page on Instagram or WhatsApp. Clients pick the service, the professional and the time on their own, no account, no app." },
      { k: "03", t: "The reminder sends itself.", b: "Confirmation and reminder by e-mail, with a button to message you on WhatsApp and a link to cancel. Fewer gaps, zero messages to send by hand." },
      { k: "04", t: "Your report fills itself in.", b: "Expected revenue, completed, cancelled and no-show bookings: your month at a glance, with your most requested services." },
    ],
    booking: { title: "Book", services: [["Cut + blow-dry", "1h", "€45.00"], ["Colour", "2h", "€90.00"], ["Manicure", "45min", "€25.00"]], slots: ["10:00", "11:30", "14:00", "16:00"], cta: "Book at 16:00" },
    mail: { from: "Studio Anna", subject: "Reminder: tomorrow at 16:00", body: "Hi Giulia, see you tomorrow at 16:00 for Cut + blow-dry.", wa: "Message us on WhatsApp", cancel: "Cancel" },
    report: { title: "Report · November", revenue: "Expected revenue", done: "Completed", total: "Bookings", noShow: "No-shows" },
    picker: { kicker: "Your colour", t: "Your brand, across the app.", b: "Pick your business colour in settings: buttons, calendar and booking page adapt. Try it here.", label: "Brand colour", custom: "Custom colour" },
    who: { kicker: "Who it's for", t: "For anyone who works by appointment." },
    pending: "Pending",
    segments: [
      { name: "Hairdressers", studio: "Salone Marta", accent: "#5fae8a", service: "Cut + blow-dry" },
      { name: "Beauticians", studio: "Beauty Lab", accent: "#e48aa6", service: "Facial" },
      { name: "Professional studios", studio: "Studio Ferri", accent: "#2f6fe0", service: "Consultation" },
      { name: "Personal trainers", studio: "Move Club", accent: "#ff7f61", service: "1:1 session" },
    ],
    priceK: "Pricing",
    priceT: ["One plan.", "Everything included."],
    plan: "Single Plan",
    perMonth: "/month",
    bullets: ["Public booking page", "Unlimited bookings", "Unlimited services, products, plans and team", "Automatic e-mail reminders", `${TRIAL_DAYS} days free, no card`, "Cancel anytime"],
    priceCta: `Try free for ${TRIAL_DAYS} days`,
    final: ["While you work,", "your page takes bookings."],
    finalCta: "Create my page",
    finalNote: `${TRIAL_DAYS} days free · ${price}/month after · cancel anytime`,
    footer: { terms: "Terms", privacy: "Privacy", by: "Developed by" },
  },
} satisfies Record<Lang, unknown>;

type T = (typeof COPY)["it"];

function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`text-[19px] font-bold tracking-[-0.035em] ${className}`}>
      agenda<span className="text-[var(--tint)]">easy.</span>
    </span>
  );
}

function Btn({ href, children, ghost }: { href: string; children: React.ReactNode; ghost?: boolean }) {
  return (
    <Link
      href={href}
      className={`ui-press inline-flex min-h-12 items-center justify-center rounded-full px-7 text-[16px] font-semibold tracking-[-0.01em] transition-transform duration-500 ease-[var(--spring)] hover:-translate-y-0.5 active:scale-[0.97] ${ghost ? "glass" : "bg-tint text-white"}`}
    >
      {children}
    </Link>
  );
}

/* ---------- Scene della storia (dentro l'iPhone) ---------- */

function SceneAgenda({ t }: { t: T }) {
  return (
    <MiniAgenda
      studio={t.studio}
      day={t.today}
      appts={t.appts}
      extra={
        <div data-enter className="bg-[var(--tint-soft)]">
          <ApptRow a={t.newAppt} />
        </div>
      }
    />
  );
}

function SceneBooking({ t }: { t: T }) {
  return (
    <div className="flex h-full flex-col">
      <div className="relative mx-3 h-24 overflow-hidden rounded-[18px] bg-[linear-gradient(135deg,var(--tint-light),var(--tint-deep))]">
        <svg viewBox="0 0 300 100" className="absolute inset-0 h-full w-full opacity-40" aria-hidden>
          <path d="M0 70 C 80 30, 160 100, 300 50 L300 100 L0 100Z" fill="#fff" />
        </svg>
      </div>
      <div className="relative z-10 -mt-7 flex flex-col items-center px-3">
        <span className="rounded-[15px] bg-white p-[3px] shadow-[0_6px_16px_-6px_rgb(40_36_30/0.35)] ring-1 ring-black/5"><Monogram letter="S" size={40} /></span>
        <p className="mt-1.5 text-[14px] font-bold tracking-[-0.02em]">{t.studio}</p>
      </div>
      <GlassCard className="mx-3 mt-3 overflow-hidden">
        {t.booking.services.map(([n, d, p], i) => (
          <div key={n} className={`flex items-center justify-between px-3 py-2.5 text-[12px] ${i ? "border-t border-[var(--separator)]" : "bg-[var(--tint-soft)]"}`}>
            <span className="font-semibold">{n} <span className="font-normal text-[var(--label-2)]">· {d}</span></span>
            <span className="rounded-full bg-[var(--fill)] px-2 py-0.5 text-[11px] font-semibold tabular-nums">{p}</span>
          </div>
        ))}
      </GlassCard>
      <div className="mx-3 mt-3 grid grid-cols-4 gap-1.5">
        {t.booking.slots.map((s) => (
          <span key={s} data-pop={s === "16:00" ? "" : undefined} className={`rounded-[10px] py-1.5 text-center text-[11px] font-semibold tabular-nums ${s === "16:00" ? "bg-tint text-white" : "glass"}`}>{s}</span>
        ))}
      </div>
      <span data-pop className="bg-tint mx-3 mt-3 rounded-full py-2.5 text-center text-[13px] font-semibold text-white">{t.booking.cta}</span>
    </div>
  );
}

function SceneReminder({ t }: { t: T }) {
  return (
    <div className="flex h-full flex-col px-3">
      <p className="mt-6 text-center text-[54px] leading-none font-semibold tracking-[-0.04em] text-[var(--label)]/80 tabular-nums">9:41</p>
      <div data-enter className="mt-6 rounded-[20px] bg-white/80 p-3 shadow-[0_10px_30px_-12px_rgb(40_30_20/0.3)] backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <Monogram letter="S" size={26} />
          <p className="flex-1 text-[11px] font-semibold">{t.mail.from}</p>
          <span className="text-[10px] text-[var(--label-3)]">ora</span>
        </div>
        <p className="mt-2 text-[12.5px] font-semibold">{t.mail.subject}</p>
        <p className="mt-0.5 text-[11.5px] leading-snug text-[var(--label-2)]">{t.mail.body}</p>
        <div className="mt-2.5 flex gap-1.5">
          <span data-pop className="flex-1 rounded-full bg-[#25d366] py-1.5 text-center text-[10.5px] font-semibold text-white">{t.mail.wa}</span>
          <span data-pop className="rounded-full bg-[var(--fill)] px-3 py-1.5 text-[10.5px] font-semibold">{t.mail.cancel}</span>
        </div>
      </div>
    </div>
  );
}

function SceneReport({ t }: { t: T }) {
  const bars = [38, 62, 48, 80, 56, 92, 70];
  return (
    <div className="flex h-full flex-col px-3.5">
      <p className="text-[22px] font-bold tracking-[-0.03em]">{t.report.title}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {[
          [t.report.revenue, 1240, 2, " €", IconChart],
          [t.report.done, 31, 0, "", IconCheck],
          [t.report.total, 38, 0, "", IconCalendar],
          [t.report.noShow, 2, 0, "", IconUsers],
        ].map(([label, n, dec, suf, Icon]) => {
          const I = Icon as typeof IconChart;
          return (
            <GlassCard key={label as string} className="p-3">
              <I size={18} className="text-[var(--tint)]" />
              <p className="mt-2 text-[20px] leading-none font-bold tracking-[-0.03em] tabular-nums" data-count={n as number} data-dec={dec as number} data-suffix={suf as string}>
                {new Intl.NumberFormat("it-IT", { minimumFractionDigits: dec as number }).format(n as number)}{suf as string}
              </p>
              <p className="mt-1 text-[10px] text-[var(--label-2)]">{label as string}</p>
            </GlassCard>
          );
        })}
      </div>
      <GlassCard className="mt-2 flex h-28 items-end gap-2 p-3">
        {bars.map((h, i) => (
          <span key={i} data-bar className="flex-1 rounded-t-[6px] bg-[linear-gradient(180deg,var(--tint-light),var(--accent))]" style={{ height: `${h}%` }} />
        ))}
      </GlassCard>
    </div>
  );
}

const SCENES = [SceneAgenda, SceneBooking, SceneReminder, SceneReport];

export default async function LandingPage() {
  const lang = await getLang();
  const t: T = COPY[lang];

  return (
    <div className="relative overflow-x-clip text-[var(--label)]">
      <LandingMotion />

      <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3">
        <div className="glass mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-full py-2 pr-2 pl-5">
          <Link href="/" aria-label="Agenda Easy"><Wordmark /></Link>
          <nav className="hidden items-center gap-7 text-[14px] font-medium text-[var(--label-2)] md:flex">
            <a href="#storia" className="hover:text-[var(--label)]">{t.nav.story}</a>
            <a href="#per-chi" className="hover:text-[var(--label)]">{t.nav.who}</a>
            <a href="#prezzo" className="hover:text-[var(--label)]">{t.nav.price}</a>
          </nav>
          <div className="flex items-center gap-1.5">
            <LanguageSwitcher current={lang} />
            <Link href="/login" className="hidden min-h-11 items-center px-3 text-[14px] font-medium sm:flex">{t.nav.signIn}</Link>
            <Link href="/signup" className="bg-tint flex min-h-11 items-center rounded-full px-5 text-[14px] font-semibold text-white">{t.nav.signUp}</Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section data-hero className="relative px-5 pt-36 pb-20 sm:pt-44">
        <div className="mx-auto max-w-6xl text-center">
          <h1 className="lp-title">
            <span className="lp-word">{t.hero[0]}</span>
            <br />
            <span className="lp-word text-[var(--tint)]" style={{ animationDelay: "120ms" }}>{t.hero[1]}</span>
          </h1>
          <p className="lp-fade mx-auto mt-7 max-w-xl text-[18px] leading-[1.45] text-[var(--label-2)] sm:text-[21px]" style={{ animationDelay: "260ms" }}>{t.heroSub}</p>
          <div className="lp-fade mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row" style={{ animationDelay: "380ms" }}>
            <Btn href="/signup">{t.heroCta}</Btn>
            <Btn href="#storia" ghost>{t.nav.story}</Btn>
          </div>
          <p className="lp-fade mt-4 text-[13px] text-[var(--label-3)]" style={{ animationDelay: "440ms" }}>{t.heroNote}</p>
        </div>

        <div className="lp-fade relative mx-auto mt-16 max-w-5xl [perspective:1800px]" style={{ animationDelay: "520ms" }}>
          <div data-hero-mac className="origin-bottom">
            <Mac className="mx-auto w-full max-w-[880px]">
              <div className="flex h-full gap-3 p-3 text-left sm:gap-4 sm:p-4">
                <div className="glass hidden w-[26%] flex-col gap-1 rounded-[16px] p-3 sm:flex">
                  <div className="mb-2 flex gap-1.5">
                    <span className="size-2 rounded-full bg-[#ff5f57]" /><span className="size-2 rounded-full bg-[#febc2e]" /><span className="size-2 rounded-full bg-[#28c840]" />
                  </div>
                  <div className="mb-3 flex items-center gap-2"><Monogram letter="S" size={28} /><span className="text-[12px] font-semibold">{t.studio}</span></div>
                  {["Agenda", "Servizi", "Piani", "Team", "Orari", "Report"].map((n, i) => (
                    <span key={n} className={`relative rounded-[9px] px-2.5 py-1.5 text-[11px] font-medium ${i === 0 ? "glass" : "text-[var(--label-2)]"}`}>
                      {i === 0 && <span className="absolute top-1/2 left-0 h-3.5 w-[2px] -translate-y-1/2 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--tint-glow)]" />}
                      {n}
                    </span>
                  ))}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[22px] font-bold tracking-[-0.03em] sm:text-[28px]">{t.today}</p>
                  <GlassCard className="mt-2 overflow-hidden">
                    {[...t.appts, t.newAppt].map((a) => <ApptRow key={a.time} a={a} />)}
                  </GlassCard>
                </div>
              </div>
            </Mac>
          </div>
          <div data-hero-phone className="absolute -right-2 -bottom-16 hidden scale-[0.82] sm:block lg:-right-10">
            <Phone><SceneBooking t={t} /></Phone>
          </div>
        </div>
      </section>

      {/* STORIA */}
      <section id="storia" data-story className="relative">
        <div data-story-stage className="story-stage mx-auto max-w-6xl px-5">
          <p className="pt-20 text-[13px] font-semibold tracking-[0.14em] text-[var(--tint)] uppercase lg:absolute lg:top-24 lg:pt-0">{t.storyKicker}</p>
          <div className="absolute top-24 right-5 hidden gap-1.5 lg:flex" aria-hidden>
            {t.story.map((s) => (
              <span key={s.k} className="h-1 w-10 overflow-hidden rounded-full bg-[var(--fill)]">
                <span data-story-dot className="block h-full origin-left scale-x-0 bg-[var(--accent)]" />
              </span>
            ))}
          </div>
          {t.story.map((s, i) => {
            const Scene = SCENES[i];
            return (
              <article key={s.k} data-story-step className="story-step grid items-center gap-10 py-16 lg:grid-cols-2 lg:py-0">
                <div className="lg:pr-10">
                  <p className="text-[15px] font-semibold text-[var(--label-3)] tabular-nums">{s.k}</p>
                  <h2 className="lp-h2 mt-3">{s.t}</h2>
                  <p className="mt-5 max-w-md text-[18px] leading-[1.5] text-[var(--label-2)]">{s.b}</p>
                </div>
                <div className="flex justify-center">
                  <Phone><Scene t={t} /></Phone>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* VIDEO */}
      <section id="video" className="px-5 py-28" data-reveal>
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-[13px] font-semibold tracking-[0.14em] text-[var(--tint)] uppercase">{t.video.kicker}</p>
          <h2 className="lp-h2 mx-auto mt-3 max-w-3xl">{t.video.t}</h2>
          <p className="mx-auto mt-5 max-w-xl text-[18px] leading-[1.5] text-[var(--label-2)]">{t.video.b}</p>
          <div className="mt-12"><PromoVideo label={t.video.label} play={t.video.play} /></div>
        </div>
      </section>

      {/* COLORE */}
      <section className="px-5 py-28 text-center" data-reveal>
        <p className="text-[13px] font-semibold tracking-[0.14em] text-[var(--tint)] uppercase">{t.picker.kicker}</p>
        <h2 className="lp-h2 mx-auto mt-3 max-w-3xl">{t.picker.t}</h2>
        <p className="mx-auto mt-5 max-w-xl text-[18px] leading-[1.5] text-[var(--label-2)]">{t.picker.b}</p>
        <div className="mt-9"><AccentPicker label={t.picker.label} custom={t.picker.custom} /></div>
      </section>

      {/* PER CHI È */}
      <section id="per-chi" data-hs className="relative flex min-h-svh flex-col justify-center overflow-hidden py-16">
        <div className="mx-auto w-full max-w-6xl px-5">
          <p className="text-[13px] font-semibold tracking-[0.14em] text-[var(--tint)] uppercase">{t.who.kicker}</p>
          <h2 className="lp-h2 mt-3 max-w-2xl">{t.who.t}</h2>
        </div>
        <div data-hs-track className="lp-hscroll mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 lg:px-[max(1.25rem,calc((100vw-72rem)/2+1.25rem))]">
          {t.segments.map((s, si) => (
            <div key={s.name} className="accent-scope glass glass-sheen flex w-[300px] shrink-0 snap-center flex-col overflow-hidden rounded-[28px] sm:w-[420px]" style={{ "--accent": s.accent } as React.CSSProperties}>
              <div className="p-6">
                <span className="inline-block size-2.5 rounded-full bg-[var(--accent)] shadow-[0_0_12px_var(--tint-glow)]" />
                <h3 className="mt-3 text-[28px] font-bold tracking-[-0.03em]">{s.name}</h3>
              </div>
              <div className="lp-screen-bg mx-4 mb-4 flex-1 rounded-[20px] p-4">
                <div className="flex items-center gap-2.5"><Monogram letter={s.studio.charAt(0)} /><span className="text-[14px] font-semibold">{s.studio}</span></div>
                <SegmentDemo
                  delay={si * 850}
                  cta={t.booking.cta}
                  pending={t.pending}
                  appts={[t.appts[0], t.newAppt, t.appts[1], t.appts[2]].map((a) => ({ ...a, service: s.service, status: t.newAppt.status, tone: "tint" as const }))}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PREZZO */}
      <section id="prezzo" className="px-5 py-28">
        <div className="mx-auto max-w-6xl text-center" data-reveal>
          <p className="text-[13px] font-semibold tracking-[0.14em] text-[var(--tint)] uppercase">{t.priceK}</p>
          <h2 className="lp-h2 mt-3">{t.priceT[0]}<br /><span className="text-[var(--label-3)]">{t.priceT[1]}</span></h2>
        </div>
        <div className="glass mx-auto mt-12 max-w-md rounded-[32px] p-8 sm:p-10" data-reveal>
          <p className="text-[15px] font-semibold text-[var(--tint)]">{t.plan}</p>
          <p className="mt-2 flex items-baseline gap-1">
            <span className="text-[64px] leading-none font-bold tracking-[-0.05em] tabular-nums">{price}</span>
            <span className="text-[17px] text-[var(--label-2)]">{t.perMonth}</span>
          </p>
          <ul className="mt-8 space-y-3.5 text-[16px]">
            {t.bullets.map((b) => (
              <li key={b} className="flex items-start gap-3">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[var(--tint-soft)] text-[var(--tint)]"><IconCheck size={13} /></span>
                {b}
              </li>
            ))}
          </ul>
          <div className="mt-9 [&>a]:w-full"><Btn href="/signup">{t.priceCta}</Btn></div>
        </div>
      </section>

      {/* CTA FINALE */}
      <section className="px-5 pt-16 pb-32 text-center" data-reveal>
        <h2 className="lp-title mx-auto max-w-5xl">{t.final[0]}<br /><span className="text-[var(--tint)]">{t.final[1]}</span></h2>
        <div className="mt-10"><Btn href="/signup">{t.finalCta}</Btn></div>
        <p className="mt-4 text-[14px] text-[var(--label-3)]">{t.finalNote}</p>
      </section>

      <footer className="border-t border-[var(--separator)] px-5 py-8 text-[13px] text-[var(--label-2)]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <Wordmark className="text-[16px] text-[var(--label)]" />
          <nav className="flex gap-6">
            <Link href="/termini" className="hover:text-[var(--label)]">{t.footer.terms}</Link>
            <Link href="/privacy" className="hover:text-[var(--label)]">{t.footer.privacy}</Link>
            <Link href="/login" className="hover:text-[var(--label)]">{t.nav.signIn}</Link>
          </nav>
          <p>© {new Date().getFullYear()} Agenda Easy · {t.footer.by}{" "}
            <a href="https://github.com/kallebesiqueira-dev" target="_blank" rel="noopener noreferrer" className="font-medium text-[var(--label)] hover:underline">Kallebe Gallo</a>
          </p>
          <a href="https://ctrlagency.dev" target="_blank" rel="noopener" className="group inline-flex items-center gap-1 text-[12px] tracking-wide text-[var(--label-3,var(--label-2))] transition-colors duration-300 hover:text-[var(--tint)]">
            {lang === "en" ? "A" : "Un progetto"}{" "}
            <span className="font-semibold text-[var(--label-2)] transition-colors duration-300 group-hover:text-[var(--tint)]">CTRL<sup className="text-[0.6em]">®</sup></span>
            {lang === "en" ? " project" : ""}
          </a>
        </div>
      </footer>

      <SupportChat />
    </div>
  );
}
