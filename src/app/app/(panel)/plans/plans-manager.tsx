"use client";

/**
 * Gestione di piani e promozioni — tutto editabile, per qualsiasi nicho.
 * I modelli ("abbonamento mensile", "promo infrasettimanale", "porta un
 * amico", "pacchetto") precompilano soltanto il form: ogni campo resta
 * modificabile prima del salvataggio.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Plan } from "@/types/database";
import type { Lang } from "@/lib/i18n";
import { formatEUR, parseEURToMinor } from "@/lib/money";
import { deletePlan, savePlan } from "./actions";

interface PlanTemplate {
  label: string;
  title: string;
  description: string;
  price: string; // input EUR già formattato; "" = senza prezzo fisso
  priceSuffix: string;
  badge: string;
}

const COPY: Record<
  Lang,
  {
    heading: string;
    intro: string;
    newPlan: string;
    empty: string;
    templatesTitle: string;
    templates: PlanTemplate[];
    inactive: string;
    edit: string;
    editPlan: string;
    priceError: string;
    title: string;
    titlePh: string;
    description: string;
    descriptionPh: string;
    price: string;
    priceOpt: string;
    pricePh: string;
    priceSuffix: string;
    priceSuffixPh: string;
    badge: string;
    badgePh: string;
    sortOrder: string;
    visible: string;
    saving: string;
    save: string;
    cancel: string;
    delete: string;
    confirmDelete: string;
  }
> = {
  it: {
    heading: "Piani e promozioni",
    intro:
      "Crea abbonamenti, sconti e promozioni su misura: compaiono nella tua pagina pubblica e i clienti li richiedono su WhatsApp. Tutto è editabile — parti da un modello o da zero.",
    newPlan: "Nuovo piano",
    empty:
      "Nessun piano ancora. Parti da un modello qui sopra o crea il tuo da zero.",
    templatesTitle: "Modelli rapidi (tutti personalizzabili)",
    templates: [
      {
        label: "📅 Abbonamento mensile",
        title: "Abbonamento mensile",
        description:
          "Un appuntamento a settimana per tutto il mese, a prezzo fisso. Prenota quando vuoi.",
        price: "80,00",
        priceSuffix: "/mese",
        badge: "Più scelto",
      },
      {
        label: "💸 Promo infrasettimanale",
        title: "Promo domenica–mercoledì",
        description:
          "Vieni nei giorni più tranquilli (domenica–mercoledì) e paghi meno dello stesso servizio nel weekend.",
        price: "",
        priceSuffix: "",
        badge: "Promo",
      },
      {
        label: "🤝 Porta un amico",
        title: "Porta 3 amici",
        description:
          "Fai prenotare 3 amici con il tuo nome e il tuo prossimo servizio è in omaggio.",
        price: "",
        priceSuffix: "",
        badge: "Fedeltà",
      },
      {
        label: "🎟️ Pacchetto",
        title: "Pacchetto 10 sedute",
        description:
          "Paghi 10 sessioni in anticipo e risparmi rispetto al prezzo singolo. Valido 6 mesi.",
        price: "",
        priceSuffix: "il pacchetto",
        badge: "Convenienza",
      },
    ],
    inactive: "non attivo",
    edit: "Modifica",
    editPlan: "Modifica piano",
    priceError: "Prezzo non valido. Es.: 45,00 (o lascia vuoto)",
    title: "Titolo",
    titlePh: "Es.: Abbonamento mensile",
    description: "Descrizione (opzionale)",
    descriptionPh: "Spiega come funziona: condizioni, giorni validi, cosa include…",
    price: "Prezzo (€)",
    priceOpt: "(opzionale — lascia vuoto per promo senza importo)",
    pricePh: "80,00",
    priceSuffix: "Testo accanto al prezzo",
    priceSuffixPh: 'Es.: "/mese", "a seduta"',
    badge: "Etichetta (opzionale)",
    badgePh: 'Es.: "Promo", "Più scelto"',
    sortOrder: "Ordine di visualizzazione",
    visible: "Visibile nella pagina pubblica",
    saving: "Salvataggio…",
    save: "Salva",
    cancel: "Annulla",
    delete: "Elimina",
    confirmDelete: "Eliminare questo piano? L'azione non si può annullare.",
  },
  en: {
    heading: "Plans & promotions",
    intro:
      "Create tailored subscriptions, discounts and promotions: they appear on your public page and clients request them on WhatsApp. Everything is editable — start from a template or from scratch.",
    newPlan: "New plan",
    empty: "No plans yet. Start from a template above or create your own.",
    templatesTitle: "Quick templates (all customisable)",
    templates: [
      {
        label: "📅 Monthly subscription",
        title: "Monthly subscription",
        description:
          "One appointment a week, all month, at a fixed price. Book whenever you like.",
        price: "80,00",
        priceSuffix: "/month",
        badge: "Most popular",
      },
      {
        label: "💸 Midweek deal",
        title: "Sunday–Wednesday deal",
        description:
          "Come on quieter days (Sunday–Wednesday) and pay less than the same service at the weekend.",
        price: "",
        priceSuffix: "",
        badge: "Deal",
      },
      {
        label: "🤝 Refer a friend",
        title: "Bring 3 friends",
        description:
          "Get 3 friends to book mentioning your name and your next service is on the house.",
        price: "",
        priceSuffix: "",
        badge: "Loyalty",
      },
      {
        label: "🎟️ Bundle",
        title: "10-session bundle",
        description:
          "Pay for 10 sessions upfront and save versus the single price. Valid 6 months.",
        price: "",
        priceSuffix: "per bundle",
        badge: "Best value",
      },
    ],
    inactive: "inactive",
    edit: "Edit",
    editPlan: "Edit plan",
    priceError: "Invalid price. E.g.: 45,00 (or leave empty)",
    title: "Title",
    titlePh: "E.g.: Monthly subscription",
    description: "Description (optional)",
    descriptionPh: "Explain how it works: conditions, valid days, what's included…",
    price: "Price (€)",
    priceOpt: "(optional — leave empty for promos without an amount)",
    pricePh: "80,00",
    priceSuffix: "Text next to the price",
    priceSuffixPh: 'E.g.: "/month", "per session"',
    badge: "Label (optional)",
    badgePh: 'E.g.: "Deal", "Most popular"',
    sortOrder: "Display order",
    visible: "Visible on the public page",
    saving: "Saving…",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    confirmDelete: "Delete this plan? This cannot be undone.",
  },
};

type PlanRow = Pick<
  Plan,
  | "id"
  | "title"
  | "description"
  | "price_minor"
  | "price_suffix"
  | "badge"
  | "active"
  | "sort_order"
>;

export function PlansManager({
  plans,
  lang,
}: {
  plans: PlanRow[];
  lang: Lang;
}) {
  const t = COPY[lang];
  const router = useRouter();
  /** null = chiuso; "new" = creazione; altrimenti id del piano in modifica */
  const [editing, setEditing] = useState<string | null>(null);
  const [template, setTemplate] = useState<PlanTemplate | null>(null);

  const current = plans.find((p) => p.id === editing) ?? null;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-semibold">{t.heading}</h2>
        <button
          type="button"
          onClick={() => {
            setTemplate(null);
            setEditing("new");
          }}
          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white"
        >
          {t.newPlan}
        </button>
      </div>
      <p className="mb-4 text-sm text-zinc-500">{t.intro}</p>

      {!editing && (
        <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
          <p className="mb-2 text-sm font-medium text-zinc-700">
            {t.templatesTitle}
          </p>
          <div className="flex flex-wrap gap-2">
            {t.templates.map((tpl) => (
              <button
                key={tpl.label}
                type="button"
                onClick={() => {
                  setTemplate(tpl);
                  setEditing("new");
                }}
                className="rounded-full border border-zinc-300 px-3 py-1.5 text-sm hover:border-zinc-900"
              >
                {tpl.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {editing && (
        <PlanForm
          key={editing + (template?.label ?? "")}
          t={t}
          plan={current}
          template={template}
          nextSortOrder={plans.length}
          onDone={() => {
            setEditing(null);
            setTemplate(null);
            router.refresh();
          }}
          onCancel={() => {
            setEditing(null);
            setTemplate(null);
          }}
        />
      )}

      {plans.length === 0 && !editing ? (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-zinc-500 shadow-sm">
          {t.empty}
        </p>
      ) : (
        <ul className="space-y-2">
          {plans.map((p) => (
            <li
              key={p.id}
              className={`rounded-2xl bg-white p-4 shadow-sm ${p.active ? "" : "opacity-60"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold text-zinc-900">
                    {p.badge && (
                      <span className="mr-2 rounded-full bg-zinc-900 px-2 py-0.5 text-xs font-semibold text-white">
                        {p.badge}
                      </span>
                    )}
                    {p.title}
                    {!p.active && (
                      <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
                        {t.inactive}
                      </span>
                    )}
                  </p>
                  {p.description && (
                    <p className="mt-1 text-sm text-zinc-500">{p.description}</p>
                  )}
                  {p.price_minor !== null && (
                    <p className="mt-1 text-sm font-semibold">
                      {formatEUR(p.price_minor)}
                      {p.price_suffix && (
                        <span className="font-normal text-zinc-500">
                          {" "}
                          {p.price_suffix}
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTemplate(null);
                    setEditing(p.id);
                  }}
                  className="shrink-0 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
                >
                  {t.edit}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PlanForm({
  t,
  plan,
  template,
  nextSortOrder,
  onDone,
  onCancel,
}: {
  t: (typeof COPY)[Lang];
  plan: PlanRow | null;
  template: PlanTemplate | null;
  nextSortOrder: number;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(plan?.title ?? template?.title ?? "");
  const [description, setDescription] = useState(
    plan?.description ?? template?.description ?? ""
  );
  const [price, setPrice] = useState(
    plan?.price_minor != null
      ? (plan.price_minor / 100).toFixed(2).replace(".", ",")
      : (template?.price ?? "")
  );
  const [priceSuffix, setPriceSuffix] = useState(
    plan?.price_suffix ?? template?.priceSuffix ?? ""
  );
  const [badge, setBadge] = useState(plan?.badge ?? template?.badge ?? "");
  const [sortOrder, setSortOrder] = useState(plan?.sort_order ?? nextSortOrder);
  const [active, setActive] = useState(plan?.active ?? true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmedPrice = price.trim();
    const priceMinor = trimmedPrice === "" ? null : parseEURToMinor(trimmedPrice);
    if (trimmedPrice !== "" && priceMinor === null) {
      setError(t.priceError);
      return;
    }
    startTransition(async () => {
      const result = await savePlan({
        id: plan?.id,
        title: title.trim(),
        description: description.trim() || null,
        price_minor: priceMinor,
        price_suffix: priceSuffix.trim() || null,
        badge: badge.trim() || null,
        active,
        sort_order: sortOrder,
      });
      if (result.error) setError(result.error);
      else onDone();
    });
  }

  function onDelete() {
    if (!plan || !window.confirm(t.confirmDelete)) return;
    startTransition(async () => {
      const result = await deletePlan(plan.id);
      if (result.error) setError(result.error);
      else onDone();
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mb-4 space-y-3 rounded-2xl bg-white p-4 shadow-sm"
    >
      <p className="font-semibold">{plan ? t.editPlan : t.newPlan}</p>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">{t.title}</span>
        <input
          required
          minLength={2}
          maxLength={80}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
          placeholder={t.titlePh}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">{t.description}</span>
        <textarea
          maxLength={600}
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
          placeholder={t.descriptionPh}
        />
      </label>
      <div className="flex flex-wrap gap-3">
        <label className="block min-w-36 flex-1">
          <span className="mb-1 block text-sm font-medium">
            {t.price}{" "}
            <span className="font-normal text-zinc-400">{t.priceOpt}</span>
          </span>
          <input
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
            placeholder={t.pricePh}
          />
        </label>
        <label className="block min-w-36 flex-1">
          <span className="mb-1 block text-sm font-medium">{t.priceSuffix}</span>
          <input
            maxLength={30}
            value={priceSuffix}
            onChange={(e) => setPriceSuffix(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
            placeholder={t.priceSuffixPh}
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-3">
        <label className="block min-w-36 flex-1">
          <span className="mb-1 block text-sm font-medium">{t.badge}</span>
          <input
            maxLength={30}
            value={badge}
            onChange={(e) => setBadge(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
            placeholder={t.badgePh}
          />
        </label>
        <label className="block w-36">
          <span className="mb-1 block text-sm font-medium">{t.sortOrder}</span>
          <input
            type="number"
            min={0}
            max={999}
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
          />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
        />
        {t.visible}
      </label>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? t.saving : t.save}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm"
        >
          {t.cancel}
        </button>
        {plan && (
          <button
            type="button"
            disabled={pending}
            onClick={onDelete}
            className="ml-auto rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 disabled:opacity-60"
          >
            {t.delete}
          </button>
        )}
      </div>
    </form>
  );
}
