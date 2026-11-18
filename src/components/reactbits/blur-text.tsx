"use client";

/**
 * BlurText, adattato da React Bits (https://reactbits.dev, David Haz, MIT).
 * Versione CSS, senza la libreria motion: le parole salgono e appaiono
 * in sequenza. Il blur di filtro è evitato perché rompe il testo sfumato.
 * Con prefers-reduced-motion il testo è subito leggibile.
 */

export function BlurText({
  text,
  className = "",
  delay = 80,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const words = text.split(" ");
  return (
    <span className={`rb-blur ${className}`}>
      <span className="sr-only">{text}</span>
      {words.map((word, index) => (
        <span
          key={`${word}-${index}`}
          aria-hidden
          className="rb-blur-word"
          style={{ animationDelay: `${index * delay}ms` }}
        >
          {word}
          {index < words.length - 1 ? "\u00A0" : ""}
        </span>
      ))}
    </span>
  );
}
