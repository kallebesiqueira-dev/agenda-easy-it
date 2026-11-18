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

/** Onde do login do CTRL Quotes, no violeta do Agenda Easy. Sem WebGL ou com movimento reduzido, o fundo fica parado. */
export function AuthWaves() {
  const env = useWavesEnv();
  if (!env.ok) return null;
  return (
    <div className="auth-waves" aria-hidden>
      <LineWaves
        color1="#c4b5fd"
        color2="#ddd6fe"
        color3="#7c3aed"
        speed={0.3}
        lineCount={env.mobile ? 40 : 72}
        lineWidth={1.3}
        highlight={1}
        warpIntensity={1}
        rotation={-33}
        enableMouseInteraction
        colorCycleSpeed={1}
        glow={0.6}
        brightness={1}
        highlightWidth={1}
        warpScale={1}
        edgeFade={0}
        mouseInfluence={2}
        clickRipple
        intro
        lightMode
        opacity={0.45}
      />
    </div>
  );
}
