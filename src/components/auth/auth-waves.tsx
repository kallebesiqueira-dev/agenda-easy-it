"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";

const LineWaves = dynamic(() => import("./line-waves"), { ssr: false, loading: () => null });

type WavesEnv = { ok: boolean; mobile: boolean };

const SERVER: WavesEnv = { ok: false, mobile: false };
let cached: WavesEnv | null = null;
let cachedKey = "";

function supportsWebGL2() {
  try {
    return Boolean(document.createElement("canvas").getContext("webgl2"));
  } catch {
    return false;
  }
}

function read(): WavesEnv {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile = window.matchMedia("(max-width: 767px)").matches;
  const key = `${reduced}|${mobile}`;
  if (cached && key === cachedKey) return cached;
  cachedKey = key;
  cached = { ok: !reduced && supportsWebGL2(), mobile };
  return cached;
}

function subscribe(listener: () => void) {
  const queries = [
    window.matchMedia("(prefers-reduced-motion: reduce)"),
    window.matchMedia("(max-width: 767px)"),
  ];
  for (const query of queries) query.addEventListener("change", listener);
  return () => {
    for (const query of queries) query.removeEventListener("change", listener);
  };
}

function useWavesEnv() {
  return useSyncExternalStore(subscribe, read, () => SERVER);
}

/** Mistura o violeta da marca com branco, igual a `tint()` do CTRL Quotes. */
function tint(amount: number) {
  const brand = 0x7c3aed;
  const channel = (shift: number) =>
    Math.round(((brand >> shift) & 255) * amount + 255 * (1 - amount));
  return `#${[16, 8, 0].map((shift) => channel(shift).toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Fundo do login do CTRL Quotes: LineWaves (React Bits), mesmos parâmetros.
 * `panel` deixa o efeito mais baixo. `hero` usa os mesmos números no violeta
 * da landing, com linhas claras para o título continuar legível.
 */
export function AuthWaves({ variant = "auth" }: { variant?: "auth" | "panel" | "hero" }) {
  const env = useWavesEnv();
  if (!env.ok) return null;
  const panel = variant === "panel";
  const hero = variant === "hero";
  const className = hero ? "auth-waves is-hero" : panel ? "auth-waves is-panel" : "auth-waves";
  return (
    <div className={className} aria-hidden>
      <LineWaves
        color1={tint(hero ? 0.72 : 0.55)}
        color2={tint(hero ? 0.42 : 0.3)}
        color3={tint(hero ? 0.9 : 0.75)}
        speed={panel ? 0.22 : 0.3}
        lineCount={panel ? (env.mobile ? 28 : 48) : env.mobile ? 40 : 72}
        lineWidth={1.3}
        highlight={1}
        warpIntensity={1}
        rotation={-33}
        enableMouseInteraction={!panel}
        colorCycleSpeed={1}
        glow={hero ? 0.45 : 0.6}
        brightness={hero ? 0.85 : 1}
        highlightWidth={1}
        warpScale={1}
        edgeFade={0}
        mouseInfluence={panel ? 0 : 2}
        clickRipple={!panel}
        intro
        lightMode={!hero}
        opacity={hero ? 0.62 : panel ? 0.22 : 0.45}
      />
    </div>
  );
}
