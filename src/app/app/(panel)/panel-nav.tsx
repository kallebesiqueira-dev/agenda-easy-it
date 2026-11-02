"use client";

/**
 * Navigazione del pannello in stile iOS/iPadOS:
 * - Sidebar: barra laterale iPadOS su desktop.
 * - TabBar: tab bar traslucida in basso su mobile, con sheet "Altro".
 * - NavBar: il Large Title della pagina collassa in una nav bar compatta
 *   sfocata quando scorre via. Solo presentazione.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import {
  IconCalendar,
  IconChart,
  IconClock,
  IconScissors,
  IconSettings,
  IconTicket,
  IconUsers,
} from "@/components/icons";

type Item = { href: string; label: string };

const ICONS: Record<string, typeof IconCalendar> = {
  "/app": IconCalendar,
  "/app/services": IconScissors,
  "/app/plans": IconTicket,
  "/app/professionals": IconUsers,
  "/app/hours": IconClock,
  "/app/report": IconChart,
  "/app/settings": IconSettings,
};

const TAB_HREFS = ["/app", "/app/services", "/app/professionals", "/app/hours"];

function useActive() {
  const pathname = usePathname();
  return (href: string) =>
    href === "/app" ? pathname === "/app" : pathname.startsWith(href);
}

export function Sidebar({ items }: { items: Item[] }) {
  const isActive = useActive();
  const nav = useRef<HTMLElement>(null);
  const [pill, setPill] = useState<{ y: number; h: number } | null>(null);
  const pathname = usePathname();

  // Pillola attiva che scivola tra le voci (layout animation via transform).
  useLayoutEffect(() => {
    const el = nav.current?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!el) return;
    const measure = () => setPill({ y: el.offsetTop, h: el.offsetHeight });
    const id = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return (
    <nav ref={nav} className="relative flex flex-col gap-1" aria-label="Menu">
      {pill && (
        <span
          aria-hidden
          className="glass absolute inset-x-0 top-0 rounded-[14px] transition-[transform,height] duration-[650ms] ease-[var(--spring)] motion-reduce:transition-none"
          style={{ transform: `translateY(${pill.y}px)`, height: pill.h }}
        >
          <span className="absolute top-1/2 left-0 h-6 w-[3px] -translate-y-1/2 rounded-full bg-[var(--green)] shadow-[0_0_12px_2px_rgb(95_209_151/0.6)]" />
        </span>
      )}
      {items.map((item) => {
        const Icon = ICONS[item.href] ?? IconCalendar;
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`relative flex min-h-11 items-center gap-3.5 rounded-[14px] px-3.5 text-[15px] font-medium tracking-[-0.01em] transition-colors ${
              active ? "text-[var(--label)]" : "text-[var(--label-2)] hover:bg-[var(--fill-2)] hover:text-[var(--label)]"
            }`}
          >
            <Icon size={21} className={active ? "text-[var(--green)]" : ""} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Sheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const scrim = useRef<HTMLDivElement>(null);
  const drag = useRef<{ y: number; dy: number } | null>(null);

  useEffect(() => {
    if (!open || !panel.current || !scrim.current) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gsap.fromTo(scrim.current, { opacity: 0 }, { opacity: 1, duration: reduce ? 0 : 0.3 });
    gsap.fromTo(
      panel.current,
      { yPercent: 100 },
      { yPercent: 0, duration: reduce ? 0 : 0.55, ease: "expo.out" }
    );
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const close = () => {
    if (!panel.current) return onClose();
    gsap.to(scrim.current, { opacity: 0, duration: 0.25 });
    gsap.to(panel.current, { yPercent: 100, duration: 0.35, ease: "power3.in", onComplete: onClose });
  };

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
      <div ref={scrim} onClick={close} className="absolute inset-0 bg-black/40" />
      <div
        ref={panel}
        className="ios-material safe-bottom absolute inset-x-2 bottom-2 rounded-[28px] px-2 pt-2 shadow-lg"
        onPointerDown={(e) => (drag.current = { y: e.clientY, dy: 0 })}
        onPointerMove={(e) => {
          if (!drag.current || !panel.current) return;
          const dy = e.clientY - drag.current.y;
          drag.current.dy = dy;
          // Rubber band verso l'alto, segue il dito verso il basso.
          const y = dy > 0 ? dy : -Math.sqrt(-dy) * 2;
          gsap.set(panel.current, { y });
        }}
        onPointerUp={() => {
          if (!drag.current || !panel.current) return;
          const { dy } = drag.current;
          drag.current = null;
          if (dy > 80) close();
          else gsap.to(panel.current, { y: 0, duration: 0.5, ease: "elastic.out(1, 0.75)" });
        }}
      >
        <div className="mx-auto mb-2 h-[5px] w-9 rounded-full bg-[var(--label-3)]" />
        {children}
      </div>
    </div>
  );
}

export function TabBar({ items, moreLabel }: { items: Item[]; moreLabel: string }) {
  const isActive = useActive();
  const [open, setOpen] = useState(false);
  const tabs = items.filter((i) => TAB_HREFS.includes(i.href));
  const rest = items.filter((i) => !TAB_HREFS.includes(i.href));
  const moreActive = rest.some((i) => isActive(i.href));

  const tabClass = (active: boolean) =>
    `ui-press flex min-h-[49px] flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium tracking-[0.01em] ${
      active ? "text-[var(--tint)]" : "text-[var(--label-2)]"
    }`;

  return (
    <>
      <nav
        aria-label="Menu"
        className="ios-material ios-hairline-t safe-bottom fixed inset-x-0 bottom-0 z-40 flex px-2 pt-1 lg:hidden"
      >
        {tabs.map((item) => {
          const Icon = ICONS[item.href] ?? IconCalendar;
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={tabClass(active)}>
              <Icon size={25} strokeWidth={active ? 2.2 : 1.75} />
              {item.label}
            </Link>
          );
        })}
        <button type="button" onClick={() => setOpen(true)} className={tabClass(moreActive)} aria-haspopup="dialog">
          <svg width="25" height="25" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <circle cx="5" cy="12" r="1.8" />
            <circle cx="12" cy="12" r="1.8" />
            <circle cx="19" cy="12" r="1.8" />
          </svg>
          {moreLabel}
        </button>
      </nav>
      <Sheet open={open} onClose={() => setOpen(false)}>
        <div className="ios-group mb-2 bg-[var(--card)]">
          {rest.map((item) => {
            const Icon = ICONS[item.href] ?? IconCalendar;
            return (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="ios-row ios-body text-[var(--label)]">
                <span className="grid size-[30px] place-items-center rounded-[8px] bg-tint text-white">
                  <Icon size={18} />
                </span>
                <span className="flex-1">{item.label}</span>
                <svg width="8" height="14" viewBox="0 0 8 14" fill="none" stroke="var(--label-3)" strokeWidth="2" strokeLinecap="round" aria-hidden>
                  <path d="m1 1 6 6-6 6" />
                </svg>
              </Link>
            );
          })}
        </div>
      </Sheet>
    </>
  );
}

/** Nav bar compatta: compare quando il Large Title (primo h2 del main) esce. */
export function NavBar({ children }: { children?: React.ReactNode }) {
  const [title, setTitle] = useState("");
  const [shown, setShown] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const h = document.querySelector("main h2");
    if (!h) return;
    const io = new IntersectionObserver(([e]) => {
      setTitle(h.textContent ?? "");
      setShown(!e.isIntersecting);
    }, {
      rootMargin: "-52px 0px 0px 0px",
    });
    io.observe(h);
    return () => io.disconnect();
  }, [pathname]);

  return (
    <header
      className={`safe-top sticky top-0 z-30 transition-[background-color,box-shadow] duration-300 ${
        shown ? "ios-material ios-hairline-b" : "bg-transparent"
      }`}
    >
      <div className="relative flex h-[52px] items-center justify-between gap-3 px-4 lg:px-10">
        <div className="min-w-0">{children}</div>
        <span
          aria-hidden={!shown}
          className={`ios-headline pointer-events-none absolute inset-x-24 truncate text-center capitalize transition-all duration-300 ease-[var(--spring)] ${
            shown ? "translate-y-0 opacity-100" : "translate-y-1.5 opacity-0"
          }`}
        >
          {title}
        </span>
      </div>
    </header>
  );
}
