"use client";

/**
 * Efeito "bolha" com GSAP: elementos marcados com [data-bubble] surgem
 * crescendo (scale + fade) conforme entram na tela ao rolar.
 */

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function ScrollBubbles() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);
    const elements = gsap.utils.toArray<HTMLElement>("[data-bubble]");
    const tweens = elements.map((el, i) =>
      gsap.fromTo(
        el,
        { opacity: 0, scale: 0.82, y: 36 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.9,
          ease: "elastic.out(1, 0.6)",
          delay: (i % 3) * 0.08, // leve cascata entre vizinhos
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        }
      )
    );

    return () => {
      tweens.forEach((t) => {
        t.scrollTrigger?.kill();
        t.kill();
      });
    };
  }, []);

  return null;
}
