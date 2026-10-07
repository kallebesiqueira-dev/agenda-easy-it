"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BusinessType } from "@/types/database";
import type { Lang } from "@/lib/i18n";
import { businessTypeOptions } from "@/lib/labels";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { createBusinessSchema } from "@/lib/validation";

const COPY: Record<
  Lang,
  {
    invalid: string;
    slugTaken: string;
    createFailed: string;
    businessName: string;
    businessNamePh: string;
    pageAddress: string;
    slugPh: string;
    businessType: string;
    creating: string;
    create: string;
  }
> = {
  it: {
    invalid: "Dati non validi.",
    slugTaken: "Questo indirizzo è già in uso. Scegline un altro.",
    createFailed: "Creazione non riuscita. Riprova.",
    businessName: "Nome dell'attività",
    businessNamePh: "Barberia da Pino",
    pageAddress: "Indirizzo della tua pagina",
    slugPh: "barberia-da-pino",
    businessType: "Tipo di attività",
    creating: "Creazione…",
    create: "Crea e vai al pannello",
  },
  en: {
    invalid: "Invalid data.",
    slugTaken: "This address is already in use. Pick another one.",
    createFailed: "Couldn't create. Please try again.",
    businessName: "Business name",
    businessNamePh: "Pino's Barbershop",
    pageAddress: "Your page address",
    slugPh: "pinos-barbershop",
    businessType: "Business type",
    creating: "Creating…",
    create: "Create and go to the dashboard",
  },
};

/** "Barberia da Pino" → "barberia-da-pino" */
function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function OnboardingForm({ lang }: { lang: Lang }) {
  const t = COPY[lang];
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [type, setType] = useState<BusinessType>("barbershop");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = createBusinessSchema.safeParse({
      name: name.trim(),
      slug,
      business_type: type,
      timezone: "Europe/Rome",
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t.invalid);
      return;
    }

    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.rpc("create_business", {
      p_name: parsed.data.name,
      p_slug: parsed.data.slug,
      p_business_type: parsed.data.business_type,
      p_timezone: parsed.data.timezone,
    });
    setLoading(false);

    if (error) {
      setError(
        error.message.includes("businesses_slug_key")
          ? t.slugTaken
          : t.createFailed
      );
      return;
    }
    router.push("/app");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label className="block">
        <span className="mb-1 block text-sm font-medium">{t.businessName}</span>
        <input
          required
          maxLength={80}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
          placeholder={t.businessNamePh}
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">{t.pageAddress}</span>
        <div className="flex items-center gap-1 rounded-lg border border-zinc-300 px-3 py-2 focus-within:border-zinc-900">
          <span className="text-sm text-zinc-400">agendaeasy.it/</span>
          <input
            required
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(slugify(e.target.value));
            }}
            className="w-full outline-none"
            placeholder={t.slugPh}
          />
        </div>
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">{t.businessType}</span>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as BusinessType)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900"
        >
          {businessTypeOptions(lang).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-zinc-900 py-3 font-semibold text-white disabled:opacity-60"
      >
        {loading ? t.creating : t.create}
      </button>
    </form>
  );
}
