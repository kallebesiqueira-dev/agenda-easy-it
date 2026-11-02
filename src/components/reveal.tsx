"use client";

/**
 * Ingresso morbido dei contenuti (GSAP): i figli diretti con `data-reveal`
 * salgono in sequenza. Rispetta prefers-reduced-motion e non tocca lo stato.
 */

import { useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";

export function Reveal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      const targets = el.querySelectorAll(
        ":scope > *, :scope > * > section, :scope > * > ul > li, [data-reveal]"
      );
      gsap.from(targets, {
        y: 14,
        opacity: 0,
        duration: 0.6,
        ease: "expo.out",
        stagger: 0.045,
        clearProps: "transform,opacity",
      });
    }, el);
    return () => ctx.revert();
  }, [pathname]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
