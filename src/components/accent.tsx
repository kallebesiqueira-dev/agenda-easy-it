/**
 * Accento del business (brand_primary) → variabili CSS dell'intera app.
 * Le sfumature (light/deep/soft) sono derivate in CSS con oklch;
 * qui calcoliamo solo il colore del testo sopra l'accento (WCAG).
 */

export const DEFAULT_ACCENT = "#5fae8a";

export function normalizeHex(hex: string | null | undefined): string {
  const raw = (hex ?? "").replace("#", "").trim();
  const full = raw.length === 3 ? [...raw].map((c) => c + c).join("") : raw;
  return /^[0-9a-f]{6}$/i.test(full) ? `#${full.toLowerCase()}` : DEFAULT_ACCENT;
}

/** Testo leggibile sull'accento: bianco se il contrasto regge, altrimenti quasi-nero. */
export function onAccent(hex: string): string {
  const full = normalizeHex(hex).slice(1);
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(full.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.3 ? "#16181a" : "#ffffff";
}

export function applyAccent(el: HTMLElement, hex: string) {
  const c = normalizeHex(hex);
  el.style.setProperty("--accent", c);
  el.style.setProperty("--on-tint", onAccent(c));
}

/** Server-side: imposta l'accento su :root prima del paint (niente flash). */
export function AccentStyle({ color }: { color: string | null | undefined }) {
  const c = normalizeHex(color);
  return <style>{`:root{--accent:${c};--on-tint:${onAccent(c)}}`}</style>;
}
