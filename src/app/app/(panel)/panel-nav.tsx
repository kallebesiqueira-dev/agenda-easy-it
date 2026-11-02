"use client";

/**
 * Navigazione del pannello: barra laterale su desktop, barra scorrevole
 * fissa in alto su mobile. Solo presentazione — evidenzia la voce attiva.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconCalendar,
  IconChart,
  IconClock,
  IconScissors,
  IconSettings,
  IconTicket,
  IconUsers,
} from "@/components/icons";

const ICONS: Record<string, typeof IconCalendar> = {
  "/app": IconCalendar,
  "/app/services": IconScissors,
  "/app/plans": IconTicket,
  "/app/professionals": IconUsers,
  "/app/hours": IconClock,
  "/app/report": IconChart,
  "/app/settings": IconSettings,
};

export function PanelNav({
  items,
  variant,
}: {
  items: { href: string; label: string }[];
  variant: "side" | "top";
}) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/app" ? pathname === "/app" : pathname.startsWith(href);

  if (variant === "top") {
    return (
      <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-3 [scrollbar-width:none] lg:hidden">
        {items.map((item) => {
          const Icon = ICONS[item.href] ?? IconCalendar;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`ui-press flex shrink-0 items-center gap-2 rounded-full px-3.5 text-sm font-medium ${
                active
                  ? "bg-zinc-900 text-[#f6f1e7]"
                  : "text-zinc-600 hover:bg-zinc-900/5 hover:text-zinc-900"
              }`}
            >
              <Icon size={17} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="flex flex-col gap-0.5">
      {items.map((item) => {
        const Icon = ICONS[item.href] ?? IconCalendar;
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`ui-press group relative flex items-center gap-3 rounded-xl px-3 text-[0.9375rem] font-medium ${
              active
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-600 hover:bg-zinc-900/[0.04] hover:text-zinc-900"
            }`}
          >
            <span
              className={`absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 rounded-full bg-[#e4572e] transition-opacity ${
                active ? "opacity-100" : "opacity-0"
              }`}
            />
            <Icon
              size={19}
              className={active ? "text-emerald-700" : "text-zinc-400 group-hover:text-zinc-600"}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
