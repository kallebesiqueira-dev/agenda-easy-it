/**
 * GradientText, adattato da React Bits (https://reactbits.dev, David Haz, MIT).
 * Sfumatura di marca che scorre sul testo. Ferma con prefers-reduced-motion.
 */

import type { ReactNode } from "react";

export function GradientText({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={`rb-gradient ${className}`}>{children}</span>;
}
