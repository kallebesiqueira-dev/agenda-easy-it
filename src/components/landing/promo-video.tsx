"use client";

import Image from "next/image";
import { useState } from "react";

const YT_ID = "0ZbTfrsfgcM";

export function PromoVideo({ label, play }: { label: string; play: string }) {
  const [active, setActive] = useState(false);

  return (
    <div className="lp-video glass relative overflow-hidden rounded-[28px] p-2 shadow-[0_30px_80px_-30px_rgb(40_36_30/0.35)] sm:rounded-[36px] sm:p-3">
      <div className="relative aspect-video overflow-hidden rounded-[20px] bg-[var(--bg)] sm:rounded-[26px]">
        {active ? (
          <iframe
            className="absolute inset-0 size-full"
            src={`https://www.youtube-nocookie.com/embed/${YT_ID}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
            title={label}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setActive(true)}
            className="group absolute inset-0 size-full cursor-pointer focus-visible:outline-none"
            aria-label={`${play}: ${label}`}
          >
            <Image
              src="/media/agenda-easy-promo-poster.webp"
              alt=""
              fill
              sizes="(min-width: 1024px) 1000px, 100vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
            />
            <span className="absolute inset-0 flex items-end justify-center pb-[7%]">
              <span className="inline-flex items-center gap-2.5 rounded-full border border-[var(--glass-border)] bg-white/65 py-3 pr-5 pl-3.5 text-[15px] font-semibold text-[var(--label)] shadow-[0_12px_40px_-12px_rgb(40_36_30/0.45)] backdrop-blur-xl transition duration-300 group-hover:scale-105 group-hover:bg-white/85 group-focus-visible:ring-2 group-focus-visible:ring-[var(--tint)]">
                <span className="grid size-9 place-items-center rounded-full bg-tint">
                  <svg aria-hidden viewBox="0 0 24 24" className="ml-0.5 size-4" fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg>
                </span>
                {play}
              </span>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
