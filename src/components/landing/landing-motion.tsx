"use client";

/**
 * Motion della landing: Lenis + GSAP ScrollTrigger.
 * Tutto parte dopo il mount (il server rende già lo stato finale → niente
 * mismatch di idratazione). Con reduced motion resta la pagina statica.
 */

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

const fmt = (n: number, dec: number) =>
  new Intl.NumberFormat("it-IT", { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(n);

function countUp(el: HTMLElement, tl?: gsap.core.Timeline, at?: number | string) {
  const target = Number(el.dataset.count);
  const dec = Number(el.dataset.dec ?? 0);
  const suffix = el.dataset.suffix ?? "";
  const o = { v: 0 };
  const tween = { v: target, duration: 1.2, ease: "power3.out", onUpdate: () => { el.textContent = fmt(o.v, dec) + suffix; } };
  if (tl) tl.fromTo(o, { v: 0 }, tween, at);
  else gsap.fromTo(o, { v: 0 }, { ...tween, scrollTrigger: { trigger: el, start: "top 85%", once: true } });
}

/** Animazioni interne di una scena (entrata appuntamento, notifica, ecc.). */
function sceneIn(step: Element, tl: gsap.core.Timeline, at: number | string) {
  step.querySelectorAll<HTMLElement>("[data-enter]").forEach((el) =>
    tl.from(el, { y: -36, opacity: 0, scale: 0.92, duration: 0.6, ease: "back.out(1.6)" }, at),
  );
  step.querySelectorAll<HTMLElement>("[data-pop]").forEach((el, i) =>
    tl.from(el, { y: 18, opacity: 0, duration: 0.5, ease: "expo.out" }, `${typeof at === "number" ? at : "<"}+${0.15 + i * 0.12}`),
  );
  step.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => countUp(el, tl, at));
  step.querySelectorAll<HTMLElement>("[data-bar]").forEach((el) =>
    tl.from(el, { scaleY: 0, transformOrigin: "bottom", duration: 0.7, ease: "expo.out" }, at),
  );
}

export function LandingMotion() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const lenis = new Lenis({ lerp: 0.09 });
      lenis.on("scroll", ScrollTrigger.update);
      const tick = (t: number) => lenis.raf(t * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);

      // Hero: Mac si raddrizza, iPhone sale in parallasse.
      gsap.fromTo("[data-hero-mac]", { rotateX: 18, y: 0 }, {
        rotateX: 0, y: -40, ease: "none",
        scrollTrigger: { trigger: "[data-hero]", start: "top top", end: "bottom top", scrub: true },
      });
      gsap.to("[data-hero-phone]", {
        y: -180, rotate: -4, ease: "none",
        scrollTrigger: { trigger: "[data-hero]", start: "top top", end: "bottom top", scrub: true },
      });

      // Reveal generico.
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) =>
        gsap.from(el, { y: 40, opacity: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 88%", once: true } }),
      );

      return () => {
        gsap.ticker.remove(tick);
        lenis.destroy();
      };
    });

    // Storytelling fissato (desktop).
    mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
      const story = document.querySelector<HTMLElement>("[data-story]");
      if (!story) return;
      story.classList.add("js-story");
      const steps = gsap.utils.toArray<HTMLElement>("[data-story-step]");
      const dots = gsap.utils.toArray<HTMLElement>("[data-story-dot]");
      gsap.set(steps[0], { autoAlpha: 1 });
      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: { trigger: "[data-story-stage]", start: "top top", end: `+=${steps.length * 90}%`, pin: true, scrub: 0.6 },
      });
      steps.forEach((step, i) => {
        const at = i * 2;
        if (i > 0) {
          tl.to(steps[i - 1], { autoAlpha: 0, y: -40, duration: 0.6 }, at - 0.3);
          tl.fromTo(step, { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 0.6 }, at);
        }
        sceneIn(step, tl, at + 0.3);
        if (dots[i]) tl.to(dots[i], { scaleX: 1, duration: 1.7, ease: "none" }, at);
      });
      tl.to({}, { duration: 0.6 });

      // Per chi è: scorrimento orizzontale fissato.
      const track = document.querySelector<HTMLElement>("[data-hs-track]");
      const hs = document.querySelector<HTMLElement>("[data-hs]");
      if (track && hs) {
        track.style.overflow = "visible";
        gsap.to(track, {
          x: () => -(track.scrollWidth - window.innerWidth + 48),
          ease: "none",
          scrollTrigger: { trigger: hs, start: "top top", end: () => `+=${track.scrollWidth - window.innerWidth}`, pin: true, scrub: 0.6, invalidateOnRefresh: true },
        });
      }
      return () => {
        story.classList.remove("js-story");
        if (track) track.style.overflow = "";
      };
    });

    // Mobile con motion: scene animate all'ingresso.
    mm.add("(max-width: 1023px) and (prefers-reduced-motion: no-preference)", () => {
      gsap.utils.toArray<HTMLElement>("[data-story-step]").forEach((step) => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: step, start: "top 70%", once: true } });
        sceneIn(step, tl, 0);
      });
    });

    // Numeri fuori dalla storia.
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      document.querySelectorAll<HTMLElement>("[data-count]:not([data-story-step] [data-count])").forEach((el) => countUp(el));
    });

    return () => mm.revert();
  }, []);
  return null;
}
