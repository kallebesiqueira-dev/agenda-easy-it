"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { BusinessSettingsInput } from "@/lib/validation";
import type { BusinessType } from "@/types/database";
import type { Lang } from "@/lib/i18n";
import { businessTypeOptions } from "@/lib/labels";
import { mediaUrl, uploadMedia } from "@/lib/storage";
import { saveSettings } from "./actions";

const COPY: Record<
  Lang,
  {
    uploadError: string;
    business: string;
    logo: string;
    removePhoto: string;
    cover: string;
    coverAlt: string;
    noCover: string;
    removeCover: string;
    coverHint: string;
    framing: string;
    name: string;
    type: string;
    brandColor: string;
    teamLabel: string;
    teamLabelPh: string;
    address: string;
    addressPh: string;
    phone: string;
    phonePh: string;
    whatsapp: string;
    whatsappPh: string;
    depositPayment: string;
    payCoords: string;
    payCoordsPh: string;
    payCoordsHint: string;
    published: string;
    publishedHint: (slug: string) => [string, string];
    saving: string;
    save: string;
    saved: string;
  }
> = {
  it: {
    uploadError: "Caricamento dell'immagine non riuscito. Riprova.",
    business: "Attività",
    logo: "Foto profilo / logo",
    removePhoto: "Rimuovi foto",
    cover: "Copertina della pagina (stile Facebook)",
    coverAlt: "Copertina",
    noCover: "Senza copertina — la pagina usa il colore del brand",
    removeCover: "Rimuovi copertina",
    coverHint:
      "Dimensione esatta: 1600×500 px. Usa una foto del tuo spazio o del tuo lavoro, senza bordi bianchi.",
    framing: "Regola l'inquadratura (↑ alto · ↓ basso)",
    name: "Nome",
    type: "Tipo di attività",
    brandColor: "Colore del brand",
    teamLabel: "Come chiamare il team (opzionale)",
    teamLabelPh: 'Es.: "Barbiere", "Onicotecnica"',
    address: "Indirizzo (opzionale)",
    addressPh: "Via, numero civico, quartiere",
    phone: "Telefono (opzionale)",
    phonePh: "06 1234 5678",
    whatsapp: "WhatsApp (opzionale)",
    whatsappPh: "333 123 4567",
    depositPayment: "Pagamento dell'acconto",
    payCoords: "Coordinate di pagamento (opzionale)",
    payCoordsPh: "IBAN, PayPal o altro riferimento per il bonifico",
    payCoordsHint:
      "Mostrate al cliente alla conferma della prenotazione per pagare l'acconto del 50%. Senza coordinate, l'acconto viene concordato di persona.",
    published: "Pagina pubblicata",
    publishedHint: () => [
      "Quando attiva, la tua pagina è online su ",
      " e accetta prenotazioni. Inserisci prima servizi, team e orari.",
    ],
    saving: "Salvataggio…",
    save: "Salva impostazioni",
    saved: "Salvato ✓",
  },
  en: {
    uploadError: "Couldn't upload the image. Please try again.",
    business: "Business",
    logo: "Profile photo / logo",
    removePhoto: "Remove photo",
    cover: "Page cover (Facebook style)",
    coverAlt: "Cover",
    noCover: "No cover — the page uses the brand colour",
    removeCover: "Remove cover",
    coverHint:
      "Exact size: 1600×500 px. Use a photo of your space or your work, without white borders.",
    framing: "Adjust framing (↑ top · ↓ bottom)",
    name: "Name",
    type: "Business type",
    brandColor: "Brand colour",
    teamLabel: "What to call the team (optional)",
    teamLabelPh: 'E.g. "Barber", "Nail artist"',
    address: "Address (optional)",
    addressPh: "Street, number, district",
    phone: "Phone (optional)",
    phonePh: "06 1234 5678",
    whatsapp: "WhatsApp (optional)",
    whatsappPh: "333 123 4567",
    depositPayment: "Deposit payment",
    payCoords: "Payment details (optional)",
    payCoordsPh: "IBAN, PayPal or another transfer reference",
    payCoordsHint:
      "Shown to the client at booking confirmation to pay the 50% deposit. Without details, the deposit is arranged in person.",
    published: "Page published",
    publishedHint: () => [
      "When active, your page is live at ",
      " and accepts bookings. Add services, team and hours first.",
    ],
    saving: "Saving…",
    save: "Save settings",
    saved: "Saved ✓",
  },
};

export function SettingsForm({
  businessId,
  lang,
  initial,
  slug,
}: {
  businessId: string;
  lang: Lang;
  initial: BusinessSettingsInput;
  slug: string;
}) {
  const t = COPY[lang];
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function set<K extends keyof BusinessSettingsInput>(
    key: K,
    value: BusinessSettingsInput[K]
  ) {
    setSaved(false);
    setForm((f) => ({ ...f, [key]: value }));
  }

  /** Input di testo opzionali: stringa vuota diventa null al submit. */
  const orNull = (v: string) => (v.trim() === "" ? null : v.trim());

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      let logoPath = form.logo_path;
      let coverPath = form.cover_path;
      try {
        if (logoFile) logoPath = await uploadMedia(businessId, "logo", logoFile);
        if (coverFile)
          coverPath = await uploadMedia(businessId, "cover", coverFile);
      } catch {
        setError(t.uploadError);
        return;
      }
      const result = await saveSettings({
        ...form,
        logo_path: logoPath,
        cover_path: coverPath,
        custom_professional_label: orNull(form.custom_professional_label ?? ""),
        address: orNull(form.address ?? ""),
        phone: orNull(form.phone ?? ""),
        whatsapp: orNull(form.whatsapp ?? ""),
        pix_key: orNull(form.pix_key ?? ""),
      });
      if (result.error) setError(result.error);
      else {
        setForm((f) => ({ ...f, logo_path: logoPath, cover_path: coverPath }));
        setLogoFile(null);
        setCoverFile(null);
        setSaved(true);
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold">{t.business}</h2>

        <div>
          <span className="mb-1 block text-sm font-medium">{t.logo}</span>
          <div className="flex flex-wrap items-center gap-3">
            {logoFile || form.logo_path ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={
                  logoFile
                    ? URL.createObjectURL(logoFile)
                    : mediaUrl(form.logo_path)!
                }
                alt="Logo"
                className="size-16 rounded-2xl object-cover"
              />
            ) : (
              <div className="flex size-16 items-center justify-center rounded-2xl bg-zinc-100 text-xl font-bold text-zinc-300">
                {form.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1 space-y-1">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                className="block w-full max-w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white"
              />
              {(form.logo_path || logoFile) && (
                <button
                  type="button"
                  onClick={() => {
                    setLogoFile(null);
                    set("logo_path", null);
                  }}
                  className="text-xs text-zinc-500 underline"
                >
                  {t.removePhoto}
                </button>
              )}
            </div>
          </div>
        </div>

        <div>
          <span className="mb-1 block text-sm font-medium">
            {t.cover}
          </span>
          {coverFile || form.cover_path ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={
                coverFile
                  ? URL.createObjectURL(coverFile)
                  : mediaUrl(form.cover_path)!
              }
              alt={t.coverAlt}
              className="h-28 w-full rounded-xl object-cover"
              style={{ objectPosition: `50% ${form.cover_position}%` }}
            />
          ) : (
            <div className="flex h-28 w-full items-center justify-center rounded-xl bg-zinc-100 text-sm text-zinc-400">
              {t.noCover}
            </div>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
              className="block w-full max-w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white sm:w-auto"
            />
            {(form.cover_path || coverFile) && (
              <button
                type="button"
                onClick={() => {
                  setCoverFile(null);
                  set("cover_path", null);
                }}
                className="whitespace-nowrap text-xs text-zinc-500 underline"
              >
                {t.removeCover}
              </button>
            )}
          </div>
          <span className="mt-1 block text-xs text-zinc-400">
            {t.coverHint}
          </span>
          {(coverFile || form.cover_path) && (
            <label className="mt-2 block">
              <span className="mb-1 flex justify-between text-xs text-zinc-500">
                <span>{t.framing}</span>
                <span>{form.cover_position}%</span>
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={form.cover_position}
                onChange={(e) =>
                  set("cover_position", Number(e.target.value))
                }
                className="w-full accent-zinc-900"
              />
            </label>
          )}
        </div>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">{t.name}</span>
          <input
            required
            maxLength={80}
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
          />
        </label>

        <div className="flex gap-3">
          <label className="block flex-1">
            <span className="mb-1 block text-sm font-medium">{t.type}</span>
            <select
              value={form.business_type}
              onChange={(e) =>
                set("business_type", e.target.value as BusinessType)
              }
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900"
            >
              {businessTypeOptions(lang).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block flex-1">
            <span className="mb-1 block text-sm font-medium">{t.brandColor}</span>
            <input
              type="color"
              value={form.brand_primary}
              onChange={(e) => set("brand_primary", e.target.value)}
              className="h-[42px] w-full rounded-lg border border-zinc-300"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">
            {t.teamLabel}
          </span>
          <input
            maxLength={30}
            value={form.custom_professional_label ?? ""}
            onChange={(e) => set("custom_professional_label", e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
            placeholder={t.teamLabelPh}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">
            {t.address}
          </span>
          <input
            maxLength={200}
            value={form.address ?? ""}
            onChange={(e) => set("address", e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
            placeholder={t.addressPh}
          />
        </label>

        <div className="flex gap-3">
          <label className="block flex-1">
            <span className="mb-1 block text-sm font-medium">
              {t.phone}
            </span>
            <input
              type="tel"
              value={form.phone ?? ""}
              onChange={(e) => set("phone", e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
              placeholder={t.phonePh}
            />
          </label>
          <label className="block flex-1">
            <span className="mb-1 block text-sm font-medium">
              {t.whatsapp}
            </span>
            <input
              type="tel"
              value={form.whatsapp ?? ""}
              onChange={(e) => set("whatsapp", e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
              placeholder={t.whatsappPh}
            />
          </label>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold">{t.depositPayment}</h2>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">{t.payCoords}</span>
          <input
            maxLength={140}
            value={form.pix_key ?? ""}
            onChange={(e) => set("pix_key", e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
            placeholder={t.payCoordsPh}
          />
          <span className="mt-1 block text-xs text-zinc-400">
            {t.payCoordsHint}
          </span>
        </label>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => set("published", e.target.checked)}
            className="mt-1"
          />
          <span>
            <span className="block font-medium">{t.published}</span>
            <span className="block text-sm text-zinc-500">
              {t.publishedHint(slug)[0]}
              <code>/{slug}</code>
              {t.publishedHint(slug)[1]}
            </span>
          </span>
        </label>
      </section>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? t.saving : t.save}
        </button>
        {saved && <span className="text-sm text-emerald-600">{t.saved}</span>}
      </div>
    </form>
  );
}
