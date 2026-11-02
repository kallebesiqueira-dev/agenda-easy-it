"use client";

import { useRef, useState } from "react";

export function PromoVideo({ label, soundOn, soundOff }: { label: string; soundOn: string; soundOff: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [sound, setSound] = useState(false);

  function enableSound() {
    const v = ref.current;
    if (!v || sound) return;
    v.muted = false;
    v.controls = true;
    void v.play();
    setSound(true);
  }

  function toggle(e: React.MouseEvent) {
    e.stopPropagation();
    const v = ref.current;
    if (!v) return;
    if (!sound) return enableSound();
    v.muted = !v.muted;
    setSound(!v.muted);
  }

  return (
    <div className="lp-video glass relative overflow-hidden rounded-[28px] p-2 shadow-[0_30px_80px_-30px_rgb(40_36_30/0.35)] sm:rounded-[36px] sm:p-3">
      <div className="relative overflow-hidden rounded-[20px] sm:rounded-[26px]" onClick={enableSound}>
        <video
          ref={ref}
          className="block aspect-video w-full cursor-pointer bg-[var(--bg)] object-cover"
          poster="/media/agenda-easy-promo-poster.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={label}
        >
          <source src="/media/agenda-easy-promo.mp4" type="video/mp4" />
        </video>
        <button
          type="button"
          onClick={toggle}
          className="absolute right-3 bottom-3 z-10 inline-flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-white/70 px-3.5 py-2 text-[13px] font-medium text-[var(--label)] shadow-sm backdrop-blur-xl transition hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-[var(--tint)] focus-visible:outline-none sm:right-4 sm:bottom-4"
          aria-pressed={sound}
        >
          <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 5 6 9H3v6h3l5 4V5z" />
            {sound ? <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /> : <path d="m16 9 5 6M21 9l-5 6" />}
          </svg>
          {sound ? soundOff : soundOn}
        </button>
      </div>
    </div>
  );
}
