/**
 * Mini-UI dell'app reale (stessi token, stesso accento) per i mockup della landing.
 * Solo markup: le animazioni stanno in landing-motion.tsx.
 */

import type { ReactNode } from "react";

export function Phone({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`lp-phone w-[260px] sm:w-[290px] ${className}`}>
      <div className="lp-phone-screen lp-screen-bg aspect-[9/19.3]">
        <div className="absolute top-2.5 left-1/2 z-10 h-[26px] w-[92px] -translate-x-1/2 rounded-full bg-black" />
        <div className="h-full pt-12">{children}</div>
      </div>
    </div>
  );
}

export function Mac({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <div className="lp-mac">
        <div className="lp-mac-screen lp-screen-bg aspect-[16/10]">{children}</div>
      </div>
      <div className="lp-mac-foot" />
    </div>
  );
}

export type Appt = { time: string; end: string; name: string; service: string; price: string; status: string; tone: "tint" | "blue" | "red" };

const TONE = {
  tint: "bg-[var(--tint-soft)] text-[var(--tint)]",
  blue: "bg-[color-mix(in_oklab,var(--blue)_14%,transparent)] text-[var(--blue)]",
  red: "bg-[color-mix(in_oklab,var(--red)_12%,transparent)] text-[var(--red)]",
};
const RAIL = { tint: "bg-[var(--accent)]", blue: "bg-[var(--blue)]", red: "bg-[var(--red)]" };

export function ApptRow({ a, attr }: { a: Appt; attr?: Record<string, string> }) {
  return (
    <div {...attr} className="flex gap-3 border-b border-[var(--separator)] px-3.5 py-3 last:border-0">
      <div className="w-11 shrink-0 text-right tabular-nums">
        <p className="text-[15px] font-bold tracking-[-0.02em]">{a.time}</p>
        <p className="text-[10px] text-[var(--label-3)]">{a.end}</p>
      </div>
      <span className={`w-[3px] shrink-0 rounded-full ${RAIL[a.tone]}`} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold">{a.name}</p>
        <p className="truncate text-[11px] text-[var(--label-2)]">{a.service}</p>
      </div>
      <div className="shrink-0 text-right">
        <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${TONE[a.tone]}`}>{a.status}</span>
        <p className="mt-1 text-[11px] font-semibold tabular-nums">{a.price}</p>
      </div>
    </div>
  );
}

export function GlassCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`glass rounded-[20px] ${className}`}>{children}</div>;
}

export function Monogram({ letter, size = 34 }: { letter: string; size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-[11px] bg-[linear-gradient(160deg,var(--tint-light),var(--tint-deep))] font-semibold text-[var(--on-tint)]"
      style={{ width: size, height: size, fontSize: size * 0.45 }}
    >
      {letter}
    </span>
  );
}

/** Agenda del giorno (telefono). */
export function MiniAgenda({ studio, day, appts, extra }: { studio: string; day: string; appts: Appt[]; extra?: ReactNode }) {
  return (
    <div className="flex h-full flex-col px-3.5">
      <div className="flex items-center gap-2.5">
        <Monogram letter={studio.charAt(0)} />
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold">{studio}</p>
          <p className="text-[8.5px] font-semibold tracking-[0.16em] text-[var(--label-2)] uppercase">AgendaEasy</p>
        </div>
      </div>
      <p className="mt-5 text-[26px] leading-none font-bold tracking-[-0.035em]">{day}</p>
      <GlassCard className="mt-3 overflow-hidden">
        {extra}
        {appts.map((a) => (
          <ApptRow key={a.time + a.name} a={a} />
        ))}
      </GlassCard>
    </div>
  );
}
