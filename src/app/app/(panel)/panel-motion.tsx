"use client";

/**
 * Movimento del pannello (GSAP 3.15, solo core).
 *
 * 1. Apertura schermata — a ogni cambio rotta i card entrano con dispersione 3D
 *    casuale (stagger "from: random") e si assestano.
 * 2. Hover 3D — tilt che segue il cursore via `gsap.quickTo` (un solo tween
 *    riusato per proprietà: niente nuovi tween a ogni mousemove) + rect messo in
 *    cache all'ingresso (niente layout-read nel pointermove). Fluido e leggero.
 * 3. CTA magnetiche — stessa tecnica quickTo.
 *
 * Rispetta `prefers-reduced-motion`; hover/tilt solo con puntatore fine.
 */

import { useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";

export function PanelMotion({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // 1) Apertura: dispersione 3D casuale dei card + hero morbido.
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(".bg-card, [data-hover]", el);
      if (cards.length) {
        // Ingresso discreto: salita + dissolvenza, con una leggera variazione
        // casuale (niente dispersione 3D marcata). Movimento morbido.
        gsap.from(cards, {
          opacity: 0,
          y: () => gsap.utils.random(10, 20),
          duration: 0.6,
          ease: "power2.out",
          stagger: { each: 0.05, from: "start" },
          clearProps: "transform,opacity",
        });
      }
      const hero = gsap.utils.toArray<HTMLElement>("[data-hero]", el);
      if (hero.length) {
        gsap.from(hero, {
          opacity: 0,
          y: -14,
          duration: 0.5,
          ease: "power2.out",
          clearProps: "transform,opacity",
        });
      }
    }, el);

    return () => ctx.revert();
  }, [pathname]);

  // 2) Hover tilt 3D + 3) CTA magnetiche — con quickTo (una sola istanza riusata).
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    if (!window.matchMedia("(hover: hover)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const cleanups: (() => void)[] = [];

    el.querySelectorAll<HTMLElement>(".bg-card:not([data-still]), [data-hover]").forEach((card) => {
      const rotX = gsap.quickTo(card, "rotationX", { duration: 0.7, ease: "power2" });
      const rotY = gsap.quickTo(card, "rotationY", { duration: 0.7, ease: "power2" });
      let rect: DOMRect | null = null;

      const onEnter = () => {
        rect = card.getBoundingClientRect();
        gsap.set(card, { transformPerspective: 1000, transformOrigin: "center center" });
        gsap.to(card, { scale: 1.008, y: -2, duration: 0.45, ease: "power2.out", overwrite: "auto" });
      };
      const onMove = (e: PointerEvent) => {
        if (!rect) rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        // Inclinazione tenue
        rotY(px * 4);
        rotX(-py * 4);
      };
      const onLeave = () => {
        rect = null;
        rotX(0);
        rotY(0);
        gsap.to(card, { scale: 1, y: 0, duration: 0.6, ease: "power2.out", overwrite: "auto" });
      };

      card.addEventListener("pointerenter", onEnter);
      card.addEventListener("pointermove", onMove, { passive: true });
      card.addEventListener("pointerleave", onLeave);
      cleanups.push(() => {
        card.removeEventListener("pointerenter", onEnter);
        card.removeEventListener("pointermove", onMove);
        card.removeEventListener("pointerleave", onLeave);
        gsap.killTweensOf(card);
        gsap.set(card, { clearProps: "transform" });
      });
    });

    el.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((mag) => {
      const xTo = gsap.quickTo(mag, "x", { duration: 0.5, ease: "power2" });
      const yTo = gsap.quickTo(mag, "y", { duration: 0.5, ease: "power2" });
      let rect: DOMRect | null = null;

      const onEnter = () => (rect = mag.getBoundingClientRect());
      const onMove = (e: PointerEvent) => {
        if (!rect) rect = mag.getBoundingClientRect();
        // Magnetismo molto leggero
        xTo((e.clientX - (rect.left + rect.width / 2)) * 0.1);
        yTo((e.clientY - (rect.top + rect.height / 2)) * 0.14);
      };
      const onLeave = () => {
        rect = null;
        xTo(0);
        yTo(0);
      };

      mag.addEventListener("pointerenter", onEnter);
      mag.addEventListener("pointermove", onMove, { passive: true });
      mag.addEventListener("pointerleave", onLeave);
      cleanups.push(() => {
        mag.removeEventListener("pointerenter", onEnter);
        mag.removeEventListener("pointermove", onMove);
        mag.removeEventListener("pointerleave", onLeave);
        gsap.killTweensOf(mag);
        gsap.set(mag, { clearProps: "transform" });
      });
    });

    return () => cleanups.forEach((c) => c());
  }, [pathname]);

  // Nessuna prospettiva sul contenitore (eviterebbe clipping/sticky dei figli):
  // ogni card porta la propria `transformPerspective`.
  return (
    <div ref={root} className="panel-motion">
      {children}
    </div>
  );
}
