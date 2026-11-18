"use client";

/**
 * Movimento del pannello (GSAP):
 * 1. Transizione di schermata — a ogni cambio di rotta le sezioni della pagina
 *    salgono e appaiono in cascata (stagger).
 * 2. Hover sui card — leggero lift + scala quando il puntatore entra in un card
 *    (`.bg-card` o `[data-hover]`), con ritorno morbido all'uscita.
 *
 * Solo presentazione: rispetta `prefers-reduced-motion` e si attiva solo dove
 * esiste un puntatore fine (niente micro-interazioni a vuoto sul touch).
 */

import { useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";

export function PanelMotion({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // 1) Transizione d'ingresso a ogni cambio pagina.
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      const page = el.firstElementChild;
      const blocks = page
        ? (Array.from(page.children) as HTMLElement[])
        : (Array.from(el.children) as HTMLElement[]);
      if (!blocks.length) return;
      gsap.from(blocks, {
        y: 20,
        opacity: 0,
        duration: 0.55,
        ease: "power3.out",
        stagger: 0.07,
        clearProps: "transform,opacity",
      });
    }, el);

    return () => ctx.revert();
  }, [pathname]);

  // 2) Micro-interazione hover sui card (ri-collegata a ogni cambio pagina).
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    if (!window.matchMedia("(hover: hover)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const cleanups: (() => void)[] = [];

    // Card: leggero lift + scala
    el.querySelectorAll<HTMLElement>(".bg-card, [data-hover]").forEach((card) => {
      const onEnter = () =>
        gsap.to(card, { y: -3, scale: 1.01, duration: 0.3, ease: "power2.out" });
      const onLeave = () =>
        gsap.to(card, { y: 0, scale: 1, duration: 0.45, ease: "power3.out" });
      card.addEventListener("pointerenter", onEnter);
      card.addEventListener("pointerleave", onLeave);
      cleanups.push(() => {
        card.removeEventListener("pointerenter", onEnter);
        card.removeEventListener("pointerleave", onLeave);
        gsap.killTweensOf(card);
        gsap.set(card, { clearProps: "transform" });
      });
    });

    // Pulsanti "magnetici": seguono leggermente il cursore
    el.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((mag) => {
      const onMove = (e: PointerEvent) => {
        const r = mag.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        gsap.to(mag, { x: dx * 0.22, y: dy * 0.32, duration: 0.4, ease: "power2.out" });
      };
      const onLeave = () =>
        gsap.to(mag, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.5)" });
      mag.addEventListener("pointermove", onMove);
      mag.addEventListener("pointerleave", onLeave);
      cleanups.push(() => {
        mag.removeEventListener("pointermove", onMove);
        mag.removeEventListener("pointerleave", onLeave);
        gsap.killTweensOf(mag);
        gsap.set(mag, { clearProps: "transform" });
      });
    });

    return () => cleanups.forEach((c) => c());
  }, [pathname]);

  return (
    <div ref={root} className="panel-motion">
      {children}
    </div>
  );
}
