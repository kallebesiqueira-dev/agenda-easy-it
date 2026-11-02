"use client";

/** Prova il tuo colore: ricolora pagina e mockup in tempo reale (stessa logica dell'app). */

import { useState } from "react";
import { applyAccent, DEFAULT_ACCENT } from "@/components/accent";

const SWATCHES = [
  { name: "Salvia", hex: DEFAULT_ACCENT },
  { name: "Oceano", hex: "#2f6fe0" },
  { name: "Corallo", hex: "#ff7f61" },
  { name: "Ambra", hex: "#e0a43a" },
  { name: "Rosa cipria", hex: "#e48aa6" },
  { name: "Grafite", hex: "#4a4f57" },
];

export function AccentPicker({ label, custom }: { label: string; custom: string }) {
  const [color, setColor] = useState(DEFAULT_ACCENT);
  const pick = (hex: string) => {
    setColor(hex);
    applyAccent(document.documentElement, hex);
  };
  return (
    <div className="glass inline-flex flex-wrap items-center gap-2 rounded-full p-2" role="radiogroup" aria-label={label}>
      {SWATCHES.map((s) => (
        <button
          key={s.hex}
          type="button"
          role="radio"
          aria-checked={color === s.hex}
          aria-label={s.name}
          title={s.name}
          onClick={() => pick(s.hex)}
          className="grid size-11 place-items-center rounded-full transition-transform duration-500 ease-[var(--spring)] hover:scale-110 active:scale-95"
        >
          <span
            className={`size-8 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08)] transition-shadow ${color === s.hex ? "ring-2 ring-[var(--label)] ring-offset-2 ring-offset-[var(--bg)]" : ""}`}
            style={{ background: s.hex }}
          />
        </button>
      ))}
      <label className="relative grid size-11 cursor-pointer place-items-center rounded-full" title={custom}>
        <span className="size-8 rounded-full bg-[conic-gradient(#ff7f61,#e0a43a,#5fae8a,#2f6fe0,#e48aa6,#ff7f61)]" />
        <input type="color" value={color} onChange={(e) => pick(e.target.value)} aria-label={custom} className="absolute inset-0 cursor-pointer opacity-0" />
      </label>
    </div>
  );
}
