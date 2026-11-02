"use client";

/**
 * Conta da 0 al valore mostrato. Il server rende già il testo finale
 * (niente mismatch di idratazione); l'animazione parte solo dopo il mount.
 */

import { useEffect, useRef } from "react";

export function CountUp({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    const m = value.match(/\d[\d.]*(,\d+)?/);
    if (!el || !m || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const raw = m[0];
    const decimals = raw.includes(",") ? raw.split(",")[1].length : 0;
    const target = parseFloat(raw.replace(/\./g, "").replace(",", "."));
    if (!target) return;
    const fmt = new Intl.NumberFormat("it-IT", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    const start = performance.now();
    const dur = 1100;
    let id = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const e = 1 - Math.pow(1 - p, 4);
      el.textContent = value.replace(raw, fmt.format(target * e));
      if (p < 1) id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(id);
      el.textContent = value;
    };
  }, [value]);
  return <span ref={ref} className="tabular-nums">{value}</span>;
}
