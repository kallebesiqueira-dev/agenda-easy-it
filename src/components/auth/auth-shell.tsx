import Link from "next/link";
import { AuthWaves } from "@/components/auth/auth-waves";
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
      <AuthWaves />
      <div className="auth-split">
        <aside className="auth-brand">
          <Link href="/" className="auth-mark" aria-label="Agenda Easy">
            <span className="auth-mark-tile">
              {/* Mesmo arquivo de src/app/icon.svg, servido em /icon.svg */}
              <img src="/icon.svg" alt="" width={48} height={48} />
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
