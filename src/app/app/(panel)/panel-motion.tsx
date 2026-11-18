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
        gsap.from(cards, {
          opacity: 0,
          x: () => gsap.utils.random(-40, 40),
          y: () => gsap.utils.random(-24, 60),
          z: () => gsap.utils.random(-120, 30),
          rotationX: () => gsap.utils.random(-26, 26),
          rotationY: () => gsap.utils.random(-26, 26),
          rotation: () => gsap.utils.random(-6, 6),
          scale: () => gsap.utils.random(0.88, 0.96),
          transformPerspective: 1000,
          transformOrigin: "center center",
          duration: 0.6,
          ease: "power3.out",
          stagger: { each: 0.04, from: "random" },
          clearProps: "transform,opacity",
        });
      }
      const hero = gsap.utils.toArray<HTMLElement>("[data-hero]", el);
      if (hero.length) {
        gsap.from(hero, {
          opacity: 0,
          y: -22,
          scale: 0.975,
          duration: 0.55,
          ease: "power3.out",
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

    el.querySelectorAll<HTMLElement>(".bg-card, [data-hover]").forEach((card) => {
      const rotX = gsap.quickTo(card, "rotationX", { duration: 0.5, ease: "power3" });
      const rotY = gsap.quickTo(card, "rotationY", { duration: 0.5, ease: "power3" });
      let rect: DOMRect | null = null;

      const onEnter = () => {
        rect = card.getBoundingClientRect();
        gsap.set(card, { transformPerspective: 800, transformOrigin: "center center" });
        gsap.to(card, { scale: 1.015, y: -4, duration: 0.35, ease: "power2.out", overwrite: "auto" });
      };
      const onMove = (e: PointerEvent) => {
        if (!rect) rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        rotY(px * 10);
        rotX(-py * 10);
      };
      const onLeave = () => {
        rect = null;
        rotX(0);
        rotY(0);
        gsap.to(card, { scale: 1, y: 0, duration: 0.5, ease: "power3.out", overwrite: "auto" });
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
      const xTo = gsap.quickTo(mag, "x", { duration: 0.4, ease: "power3" });
      const yTo = gsap.quickTo(mag, "y", { duration: 0.4, ease: "power3" });
      let rect: DOMRect | null = null;

      const onEnter = () => (rect = mag.getBoundingClientRect());
      const onMove = (e: PointerEvent) => {
        if (!rect) rect = mag.getBoundingClientRect();
        xTo((e.clientX - (rect.left + rect.width / 2)) * 0.22);
        yTo((e.clientY - (rect.top + rect.height / 2)) * 0.32);
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
