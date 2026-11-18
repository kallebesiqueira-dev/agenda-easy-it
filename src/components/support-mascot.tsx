"use client";

/**
 * Mascotte originale di Agenda Easy: tessera-agenda viola con due occhi.
 * Non deriva da nessun logo di terzi. Gli occhi sbattono le palpebre,
 * guardano in giro e, su desktop, seguono il cursore.
 * Con prefers-reduced-motion restano fermi.
 */

import { useEffect, useId, useRef } from "react";

export function SupportMascot({ size = 40 }: { size?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const pupils = useRef<SVGGElement>(null);
  const fillId = useId().replace(/:/g, "");

  useEffect(() => {
    const root = ref.current;
    const eyes = pupils.current;
    if (!root || !eyes) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (reduce || !fine) return;

    root.classList.add("is-tracking");
    let frame = 0;
    const onMove = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const box = root.getBoundingClientRect();
        const dx = event.clientX - (box.left + box.width / 2);
        const dy = event.clientY - (box.top + box.height / 2);
        const dist = Math.hypot(dx, dy) || 1;
        const max = Math.max(1.4, size * 0.055);
        const reach = Math.min(max, dist / 48);
        eyes.style.transform = `translate(${((dx / dist) * reach).toFixed(2)}px, ${((dy / dist) * reach).toFixed(2)}px)`;
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      root.classList.remove("is-tracking");
      eyes.style.transform = "";
    };
  }, [size]);

  return (
    <span
      ref={ref}
      className="ae-mascot rounded-full bg-white shadow-[0_1px_2px_rgb(16_15_20/0.12)]"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 64 64" width={size * 0.82} height={size * 0.82}>
        <defs>
          <linearGradient id={fillId} x1="10" y1="4" x2="54" y2="62" gradientUnits="userSpaceOnUse">
            <stop stopColor="#a78bfa" />
            <stop offset="0.45" stopColor="#7c3aed" />
            <stop offset="1" stopColor="#5b21b6" />
          </linearGradient>
        </defs>
        <rect x="6" y="10" width="52" height="48" rx="16" fill={`url(#${fillId})`} />
        <rect x="6" y="10" width="52" height="14" rx="8" fill="#ffffff" opacity="0.16" />
        <rect x="18" y="6" width="8" height="10" rx="3" fill="#ddd6fe" />
        <rect x="38" y="6" width="8" height="10" rx="3" fill="#ddd6fe" />
        <g className="ae-mascot-eyes">
          <ellipse cx="24" cy="36" rx="8" ry="9" fill="#fff" />
          <ellipse cx="40" cy="36" rx="8" ry="9" fill="#fff" />
          <g ref={pupils} className="ae-mascot-pupils">
            <circle cx="25.2" cy="37.2" r="3.3" fill="#1a1a1e" />
            <circle cx="41.2" cy="37.2" r="3.3" fill="#1a1a1e" />
            <circle cx="26.4" cy="36" r="1.1" fill="#fff" />
            <circle cx="42.4" cy="36" r="1.1" fill="#fff" />
          </g>
        </g>
      </svg>
    </span>
  );
}
