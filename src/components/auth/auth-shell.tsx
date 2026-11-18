import Link from "next/link";
import type { Lang } from "@/lib/i18n";

/**
 * Scheda di accesso in due pannelli, come CTRL Quotes:
 * a sinistra il viola di marca con un fondo che si muove, a destra il form.
 */
export function AuthShell({
  lang,
  children,
}: {
  lang: Lang;
  children: React.ReactNode;
}) {
  const line =
    lang === "en"
      ? "Your calendar. Finally simple."
      : "La tua agenda. Finalmente semplice.";

  return (
    <main className="auth-screen">
      <div className="auth-wash" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <div className="auth-split">
        <aside className="auth-brand">
          <Link href="/" className="auth-mark" aria-label="Agenda Easy">
            <span className="auth-mark-tile">
              <svg viewBox="0 0 48 48" width="48" height="48" aria-hidden>
                <rect x="4" y="8" width="40" height="36" rx="12" fill="#fff" />
                <rect x="14" y="4" width="6" height="8" rx="2" fill="#ddd6fe" />
                <rect x="28" y="4" width="6" height="8" rx="2" fill="#ddd6fe" />
                <circle cx="18" cy="26" r="3" fill="#7c3aed" />
                <circle cx="30" cy="26" r="3" fill="#7c3aed" />
              </svg>
            </span>
            <span className="auth-mark-word">
              agenda<span>easy.</span>
            </span>
          </Link>
          <p className="auth-brand-line">{line}</p>
        </aside>
        <section className="auth-card">{children}</section>
      </div>
    </main>
  );
}
