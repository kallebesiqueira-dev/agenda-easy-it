"use client";

/** Scroll fluido (Lenis) per le pagine pubbliche. Disattivo con reduced motion. */

import { useEffect } from "react";

export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let id = 0;
    let destroy: (() => void) | undefined;
    let cancelled = false;

    // Lenis caricato on-demand: fuori dal bundle iniziale della pagina.
    import("lenis").then(({ default: Lenis }) => {
      if (cancelled) return;
      const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
      const raf = (t: number) => {
        lenis.raf(t);
        id = requestAnimationFrame(raf);
      };
      id = requestAnimationFrame(raf);
      destroy = () => {
        cancelAnimationFrame(id);
        lenis.destroy();
      };
    });

    return () => {
      cancelled = true;
      destroy?.();
    };
  }, []);
  return null;
}
