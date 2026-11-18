"use client";

/**
 * Movimento del pannello (GSAP 3.15, solo core: trasformazioni 3D native —
 * rotationX/rotationY/transformPerspective — nessun plugin a pagamento).
 *
 * 1. Apertura schermata — a ogni cambio rotta i card entrano con una
 *    dispersione 3D CASUALE (posizione, rotazione e scala random, stagger
 *    "from: random") e si assestano al loro posto.
 * 2. Hover 3D — ogni card s'inclina seguendo il cursore (tilt rotationX/Y con
 *    prospettiva) e torna morbido all'uscita.
 * 3. CTA magnetiche — i pulsanti "Nuovo…" seguono leggermente il cursore.
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
          x: () => gsap.utils.random(-45, 45),
          y: () => gsap.utils.random(-30, 70),
          z: () => gsap.utils.random(-140, 40),
          rotationX: () => gsap.utils.random(-30, 30),
          rotationY: () => gsap.utils.random(-30, 30),
          rotation: () => gsap.utils.random(-7, 7),
          scale: () => gsap.utils.random(0.85, 0.95),
          transformPerspective: 1000,
          transformOrigin: "center center",
          duration: 0.85,
          ease: "power3.out",
          stagger: { each: 0.05, from: "random" },
          clearProps: "transform,opacity",
        });
      }
      const hero = gsap.utils.toArray<HTMLElement>("[data-hero]", el);
      if (hero.length) {
        gsap.from(hero, {
          opacity: 0,
          y: -24,
          scale: 0.97,
          duration: 0.7,
          ease: "power3.out",
          clearProps: "transform,opacity",
        });
      }
    }, el);

    return () => ctx.revert();
  }, [pathname]);

  // 2) Hover: tilt 3D che segue il cursore + 3) CTA magnetiche.
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    if (!window.matchMedia("(hover: hover)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const cleanups: (() => void)[] = [];

    el.querySelectorAll<HTMLElement>(".bg-card, [data-hover]").forEach((card) => {
      const onMove = (e: PointerEvent) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5; // -0.5..0.5
        const py = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(card, {
          rotationY: px * 13,
          rotationX: -py * 13,
          transformPerspective: 700,
          transformOrigin: "center center",
          scale: 1.02,
          y: -4,
          duration: 0.4,
          ease: "power2.out",
          overwrite: "auto",
        });
      };
      const onLeave = () =>
        gsap.to(card, {
          rotationX: 0,
          rotationY: 0,
          scale: 1,
          y: 0,
          duration: 0.6,
          ease: "power3.out",
          overwrite: "auto",
        });
      card.addEventListener("pointermove", onMove);
      card.addEventListener("pointerleave", onLeave);
      cleanups.push(() => {
        card.removeEventListener("pointermove", onMove);
        card.removeEventListener("pointerleave", onLeave);
        gsap.killTweensOf(card);
        gsap.set(card, { clearProps: "transform" });
      });
    });

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
    <div ref={root} className="panel-motion [perspective:1200px] [transform-style:preserve-3d]">
      {children}
    </div>
  );
}
