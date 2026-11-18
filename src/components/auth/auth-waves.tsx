"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useSyncExternalStore } from "react";
import { DEFAULT_ACCENT, normalizeHex } from "@/components/accent";

const LineWaves = dynamic(() => import("./line-waves"), { ssr: false, loading: () => null });

function useAfterIdle() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const start = () => setReady(true);
    if (typeof requestIdleCallback === "function") {
      const id = requestIdleCallback(start, { timeout: 1200 });
      return () => cancelIdleCallback(id);
    }
    const id = window.setTimeout(start, 200);
    return () => window.clearTimeout(id);
  }, []);
  return ready;
}

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

/** Mistura a cor da marca com branco, igual a `tint()` do CTRL Quotes. */
function tint(hex: string, amount: number) {
  const brand = Number.parseInt(normalizeHex(hex).slice(1), 16);
  const channel = (shift: number) =>
    Math.round(((brand >> shift) & 255) * amount + 255 * (1 - amount));
  return `#${[16, 8, 0].map((shift) => channel(shift).toString(16).padStart(2, "0")).join("")}`;
}

function useAccent() {
  const [hex, setHex] = useState(DEFAULT_ACCENT);
  useEffect(() => {
    const read = () => {
      const value = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
      if (value) setHex(normalizeHex(value));
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["style"] });
    return () => observer.disconnect();
  }, []);
  return hex;
}

/**
 * Fundo do login do CTRL Quotes: LineWaves (React Bits), mesmos parâmetros.
 * `panel` deixa o efeito mais baixo. `hero` usa os mesmos números no violeta
 * da landing, com linhas claras para o título continuar legível.
 */
export function AuthWaves({
  variant = "auth",
  color,
}: {
  variant?: "auth" | "panel" | "hero" | "public";
  color?: string;
}) {
  const env = useWavesEnv();
  const idle = useAfterIdle();
  const accent = useAccent();
  if (!env.ok || !idle) return null;
  const panel = variant === "panel";
  const hero = variant === "hero";
  const pub = variant === "public";
  const quiet = panel || pub;
  const brand = color ?? (hero ? accent : DEFAULT_ACCENT);
  const className = hero
    ? "auth-waves is-hero"
    : pub
      ? "auth-waves is-public"
      : panel
        ? "auth-waves is-panel"
        : "auth-waves";
  return (
    <div className={className} aria-hidden>
      <LineWaves
        color1={tint(brand, hero ? 0.72 : 0.55)}
        color2={tint(brand, hero ? 0.42 : 0.3)}
        color3={tint(brand, hero ? 0.9 : 0.75)}
        speed={quiet ? 0.22 : 0.3}
        lineCount={quiet ? (env.mobile ? 16 : 48) : env.mobile ? 22 : 72}
        maxDevicePixelRatio={1.5}
        lineWidth={1.3}
        highlight={1}
        warpIntensity={1}
        rotation={-33}
        enableMouseInteraction={!quiet}
        colorCycleSpeed={1}
        glow={hero ? 0.45 : pub ? 0.35 : 0.6}
        brightness={hero ? 0.85 : 1}
        highlightWidth={1}
        warpScale={1}
        edgeFade={0}
        mouseInfluence={quiet ? 0 : 2}
        clickRipple={!quiet}
        intro
        lightMode={!hero}
        opacity={hero ? 0.62 : pub ? 0.2 : panel ? 0.22 : 0.45}
      />
    </div>
  );
}
