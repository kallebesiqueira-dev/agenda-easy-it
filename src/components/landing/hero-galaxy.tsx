"use client";

import { useSyncExternalStore, type ComponentType } from "react";
import Galaxy from "@/components/landing/galaxy";

const Stars = Galaxy as ComponentType<Record<string, unknown>>;

const SERVER = { mobile: false, reduced: true };
let cached = SERVER;
let cachedKey = "";

function read() {
  const mobile = window.matchMedia("(max-width: 767px)").matches;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const key = `${mobile}|${reduced}`;
  if (key === cachedKey) return cached;
  cachedKey = key;
  cached = { mobile, reduced };
  return cached;
}

function subscribe(listener: () => void) {
  const queries = [
    window.matchMedia("(max-width: 767px)"),
    window.matchMedia("(prefers-reduced-motion: reduce)"),
  ];
  for (const query of queries) query.addEventListener("change", listener);
  return () => {
    for (const query of queries) query.removeEventListener("change", listener);
  };
}

/** Galaxy (React Bits) no hero. Sem WebGL ou com movimento reduzido, fica o degradê violeta. */
export function HeroGalaxy() {
  const env = useSyncExternalStore(subscribe, read, () => SERVER);
  if (env.reduced) return null;
  return (
    <Stars
      className="ae-galaxy"
      starColors={["#f5f3ff", "#ddd6fe", "#c4b5fd", "#a78bfa"]}
      hueShift={270}
      density={env.mobile ? 0.42 : 0.78}
      layers={env.mobile ? 3 : 4}
      glowIntensity={0.38}
      saturation={0.7}
      starSpeed={0.32}
      speed={0.65}
      rotationSpeed={0.05}
      twinkleIntensity={0.28}
      starSize={0.85}
      flareIntensity={0.65}
      mouseInteraction
      mouseRepulsion
      repulsionStrength={1.1}
      transparent
      opacity={0.92}
      intro
    />
  );
}
