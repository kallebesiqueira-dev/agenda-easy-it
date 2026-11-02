"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ApptRow, GlassCard, type Appt } from "./app-mock";

/** Mini-agenda viva nelle card "Per chi è": gli appuntamenti scorrono, lo stato passa da in attesa a confermato. */
export function SegmentDemo({ appts, cta, pending, delay = 0 }: { appts: Appt[]; cta: string; pending: string; delay?: number }) {
  const root = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);
  const [confirmed, setConfirmed] = useState(true);
  const n = appts.length;
  const rows = [appts[i % n], appts[(i + 1) % n]];

  // Ciclo solo se visibile e senza reduced-motion.
  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    let start: ReturnType<typeof setTimeout> | undefined;
    const stop = () => { clearInterval(timer); clearTimeout(start); timer = start = undefined; };
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !timer && !start) {
        start = setTimeout(() => {
          start = undefined;
          timer = setInterval(() => { setI((v) => v + 1); setConfirmed(false); }, 3400);
        }, delay);
      } else if (!e.isIntersecting) stop();
    }, { threshold: 0.3 });
    io.observe(el);
    const pulse = gsap.to(el.querySelector("[data-seg-cta]"), { scale: 1.03, boxShadow: "0 10px 28px -8px var(--tint-glow)", duration: 1.1, ease: "sine.inOut", yoyo: true, repeat: -1 });
    return () => { io.disconnect(); stop(); pulse.kill(); };
  }, [delay]);

  // Entrata delle righe ad ogni giro, poi conferma dello stato.
  useLayoutEffect(() => {
    if (i === 0) return;
    const el = root.current!;
    const ctx = gsap.context(() => {
      gsap.from("[data-seg-row='0']", { y: 18, duration: 0.55, ease: "power3.out" });
      gsap.from("[data-seg-row='1']", { y: 26, opacity: 0, duration: 0.6, ease: "power3.out", delay: 0.08 });
    }, el);
    const t = setTimeout(() => setConfirmed(true), 1300);
    return () => { ctx.revert(); clearTimeout(t); };
  }, [i]);

  useLayoutEffect(() => {
    if (i === 0 || !confirmed) return;
    const pill = root.current?.querySelector("[data-seg-row='1'] .rounded-full.px-1\\.5");
    if (pill) gsap.fromTo(pill, { scale: 0.7 }, { scale: 1, duration: 0.45, ease: "back.out(3)" });
  }, [confirmed, i]);

  return (
    <div ref={root}>
      <GlassCard className="mt-3 overflow-hidden">
        {rows.map((a, k) => (
          <ApptRow
            key={`${i + k}`}
            attr={{ "data-seg-row": String(k) }}
            a={k === 1 && !confirmed ? { ...a, status: pending, tone: "blue" } : a}
          />
        ))}
      </GlassCard>
      <span data-seg-cta className="bg-tint mt-3 block rounded-full py-2.5 text-center text-[13px] font-semibold text-white will-change-transform">{cta}</span>
    </div>
  );
}
