"use client";

import { useMemo, useState, type ReactNode } from "react";
import { IconCalendarEmpty } from "@/components/icons";
import type { Lang } from "@/lib/i18n";
import type { AppointmentStatus } from "@/types/database";
import { AppointmentCard, type AppointmentCardData } from "./appointment-card";

const FILTERS: AppointmentStatus[] = ["confirmed", "completed", "cancelled", "no_show"];

const COPY: Record<
  Lang,
  {
    search: string;
    searchPh: string;
    all: string;
    status: Record<AppointmentStatus, string>;
    noMatch: string;
    share: string;
  }
> = {
  it: {
    search: "Cerca prenotazioni",
    searchPh: "Cliente, servizio o professionista",
    all: "Tutte",
    status: {
      confirmed: "Confermate",
      completed: "Completate",
      cancelled: "Annullate",
      no_show: "Non presentati",
    },
    noMatch: "Nessuna prenotazione corrisponde alla ricerca.",
    share: "Apri la pagina pubblica",
  },
  en: {
    search: "Search bookings",
    searchPh: "Client, service or professional",
    all: "All",
    status: {
      confirmed: "Confirmed",
      completed: "Completed",
      cancelled: "Cancelled",
      no_show: "No-shows",
    },
    noMatch: "No bookings match this search.",
    share: "Open the public page",
  },
};

export function DayAgenda({
  cards,
  lang,
  empty,
  shareHref,
}: {
  cards: AppointmentCardData[];
  lang: Lang;
  empty: string;
  shareHref: string | null;
}) {
  const t = COPY[lang];
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | AppointmentStatus>("all");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cards.filter((card) => {
      if (status !== "all" && card.status !== status) return false;
      if (!q) return true;
      return `${card.customerName} ${card.serviceName} ${card.professionalName}`
        .toLowerCase()
        .includes(q);
    });
  }, [cards, query, status]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="min-w-0 flex-1">
          <span className="sr-only">{t.search}</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.searchPh}
            className="min-h-11 w-full rounded-full px-4"
          />
        </label>
        <div className="flex gap-1 overflow-x-auto pb-0.5" role="tablist" aria-label={t.search}>
          <FilterChip active={status === "all"} onClick={() => setStatus("all")}>
            {t.all}
          </FilterChip>
          {FILTERS.map((key) => (
            <FilterChip key={key} active={status === key} onClick={() => setStatus(key)}>
              {t.status[key]}
            </FilterChip>
          ))}
        </div>
      </div>

      {cards.length === 0 ? (
        <EmptyState text={empty} shareHref={shareHref} share={t.share} />
      ) : visible.length === 0 ? (
        <EmptyState text={t.noMatch} shareHref={null} share={t.share} />
      ) : (
        <ul className="ios-group">
          {visible.map((card) => (
            <li key={card.id}>
              <AppointmentCard data={card} lang={lang} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`ui-press min-h-9 shrink-0 rounded-full px-3 text-[13px] font-semibold ${
        active
          ? "bg-[var(--accent)] text-white"
          : "bg-[var(--fill)] text-[var(--ink-soft)] hover:bg-[var(--tint-soft)]"
      }`}
    >
      {children}
    </button>
  );
}

function EmptyState({
  text,
  shareHref,
  share,
}: {
  text: string;
  shareHref: string | null;
  share: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-[22px] bg-card px-6 py-14 text-center">
      <span className="mb-4 grid size-14 place-items-center rounded-[18px] bg-[var(--tint-soft)] text-[var(--tint)]">
        <IconCalendarEmpty size={26} />
      </span>
      <p className="max-w-xs text-[15px] text-[var(--label-2)]">{text}</p>
      {shareHref && (
        <a
          href={shareHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 text-[14px] font-semibold text-[var(--tint)] underline decoration-[var(--tint)]/40 underline-offset-4"
        >
          {share}
        </a>
      )}
    </div>
  );
}
