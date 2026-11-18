/**
 * Hero di pagina del pannello — la fascia di marca in cima a ogni schermata,
 * ricostruita dai mockup: superficie con gradiente dell'accento (--accent),
 * sfere traslucide decorative, titolo + sottotitolo e uno slot azione.
 *
 * Il colore segue `brand_primary` (via .brand-fill → var(--accent)): quando
 * l'attività cambia colore, l'hero cambia con tutto il resto dell'app.
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
      className={`brand-fill relative isolate flex min-h-[150px] flex-col justify-center overflow-hidden rounded-[24px] px-6 py-7 text-[var(--on-tint)] shadow-[var(--shadow-md)] sm:px-8 ${className}`}
    >
      {/* Sfere morbide in basso a destra (come nei mockup) */}
      <span aria-hidden className="pointer-events-none absolute -right-20 -bottom-28 size-80 rounded-full bg-white/15" />
      <span aria-hidden className="pointer-events-none absolute -right-6 -bottom-12 size-48 rounded-full bg-white/10" />
      <div className="relative flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <h2 className="ios-title1 text-[clamp(25px,2.6vw,32px)] leading-[1.1]">{title}</h2>
          {subtitle && (
            <p className="mt-1.5 max-w-md text-[15px] leading-snug text-[color-mix(in_srgb,var(--on-tint)_80%,transparent)]">
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
 * CTA chiara usata negli hero: pill bianca ad alto contrasto sull'accento,
 * neutra (non cambia col brand), come i pulsanti "Nuovo …" dei mockup.
 */
export function HeroButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className="ui-press inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-5 text-[15px] font-semibold text-[#1a1a1e] shadow-[0_8px_20px_rgb(16_15_20/0.22)] hover:bg-white/90 disabled:opacity-60"
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
