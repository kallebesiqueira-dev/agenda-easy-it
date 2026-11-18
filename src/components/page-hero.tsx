/**
 * Hero di pagina del pannello — la fascia in cima a ogni schermata.
 * Sfondo: l'immagine di marca dei mockup (`/hero-viola.webp`, il pannello
 * astratto viola sfumato con le due sfere), copia fedele. Sopra: titolo +
 * sottotitolo e uno slot azione.
 *
 * Il titolo è un <h2>: la NavBar compatta osserva il primo `main h2` per
 * mostrare il titolo quando l'hero esce dallo schermo. Tenerlo h2 è voluto.
 */

export function PageHero({
  title,
  subtitle,
  action,
  className = "",
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Controlli a destra: CTA (pill scura) o frecce di navigazione. */
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      data-hero
      className={`relative isolate flex min-h-[150px] flex-col justify-center overflow-hidden rounded-[24px] px-6 py-7 text-white shadow-[var(--shadow-md)] sm:px-8 ${className}`}
    >
      {/* Immagine di marca dei mockup (pannello astratto viola sfumato): dà la
          trama e le sfere (luminanza). */}
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(/hero-viola.webp)" }}
      />
      {/* Tinta dell'accento sopra l'immagine: `mix-blend-mode: color` sostituisce
          solo la tonalità mantenendo il chiaroscuro → l'hero segue brand_primary
          (viola di default, ma cambia quando l'attività cambia colore). */}
      <div
        aria-hidden
        className="absolute inset-0 [mix-blend-mode:color]"
        style={{ backgroundColor: "var(--accent)" }}
      />
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
        <div className="min-w-0 [text-shadow:0_1px_12px_rgb(40_20_90/0.35)]">
          <h2 className="ios-title1 text-[clamp(25px,2.6vw,32px)] leading-[1.1]">{title}</h2>
          {subtitle && (
            <p className="mt-1.5 max-w-md text-[15px] leading-snug text-white/85">
              {subtitle}
            </p>
          )}
        </div>
        {action && <div className="relative shrink-0">{action}</div>}
      </div>
    </section>
  );
}

/**
 * CTA scura usata negli hero: pill quasi-nera ad alto contrasto sull'immagine,
 * neutra, come i pulsanti "Nuovo …" dei mockup.
 */
export function HeroButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      data-magnetic
      {...props}
      className="ui-press inline-flex min-h-11 items-center gap-2 rounded-full bg-[#16181a] px-5 text-[15px] font-semibold text-white shadow-[0_8px_20px_rgb(16_15_20/0.3)] hover:bg-[#26272b] disabled:opacity-60"
    >
      {children}
    </button>
  );
}

/** Icona "+" per le CTA (non esiste un IconPlus nel set). */
export function IconPlus({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" aria-hidden>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
