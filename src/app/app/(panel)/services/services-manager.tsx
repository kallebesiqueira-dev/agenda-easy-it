"use client";

/**
 * Gestione di servizi E prodotti (stessa tabella, item_type distingue).
 * I servizi sono prenotabili (durata obbligatoria); i prodotti sono vetrina
 * sulla pagina pubblica (niente durata, nessuna prenotazione).
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ItemType, Service } from "@/types/database";
import type { Lang } from "@/lib/i18n";
import { formatEUR, parseEURToMinor } from "@/lib/money";
import { mediaUrl, uploadMedia } from "@/lib/storage";
import { saveService } from "./actions";

const COPY: Record<
  Lang,
  {
    heading: string;
    tabServices: string;
    tabProducts: string;
    newService: string;
    newProduct: string;
    emptyServices: string;
    emptyProducts: string;
    inactive: string;
    edit: string;
    priceError: string;
    uploadError: string;
    editService: string;
    editProduct: string;
    name: string;
    namePh: string;
    productNamePh: string;
    description: string;
    descriptionPh: string;
    productDescriptionPh: string;
    price: string;
    duration: string;
    photo: string;
    preview: string;
    removePhoto: string;
    visible: string;
    saving: string;
    save: string;
    cancel: string;
  }
> = {
  it: {
    heading: "Servizi e prodotti",
    tabServices: "Servizi",
    tabProducts: "Prodotti",
    newService: "Nuovo servizio",
    newProduct: "Nuovo prodotto",
    emptyServices:
      "Inserisci il tuo primo servizio per comparire nella pagina di prenotazione.",
    emptyProducts:
      "Aggiungi i prodotti che vendi (es. pomata, shampoo): compaiono in vetrina nella tua pagina.",
    inactive: "non attivo",
    edit: "Modifica",
    priceError: "Prezzo non valido. Es.: 45,00",
    uploadError: "Caricamento della foto non riuscito. Riprova.",
    editService: "Modifica servizio",
    editProduct: "Modifica prodotto",
    name: "Nome",
    namePh: "Taglio uomo",
    productNamePh: "Pomata modellante",
    description: "Descrizione (opzionale)",
    descriptionPh: "Forbici e macchinetta",
    productDescriptionPh: "Fissaggio forte, 100 ml",
    price: "Prezzo (€)",
    duration: "Durata",
    photo: "Foto (opzionale)",
    preview: "Anteprima",
    removePhoto: "Rimuovi foto",
    visible: "Visibile nella pagina pubblica",
    saving: "Salvataggio…",
    save: "Salva",
    cancel: "Annulla",
  },
  en: {
    heading: "Services & products",
    tabServices: "Services",
    tabProducts: "Products",
    newService: "New service",
    newProduct: "New product",
    emptyServices: "Add your first service to appear on the booking page.",
    emptyProducts:
      "Add the products you sell (e.g. pomade, shampoo): they show up on your public page.",
    inactive: "inactive",
    edit: "Edit",
    priceError: "Invalid price. E.g.: 45,00",
    uploadError: "Couldn't upload the photo. Please try again.",
    editService: "Edit service",
    editProduct: "Edit product",
    name: "Name",
    namePh: "Men's haircut",
    productNamePh: "Styling pomade",
    description: "Description (optional)",
    descriptionPh: "Scissors and clippers",
    productDescriptionPh: "Strong hold, 100 ml",
    price: "Price (€)",
    duration: "Duration",
    photo: "Photo (optional)",
    preview: "Preview",
    removePhoto: "Remove photo",
    visible: "Visible on the public page",
    saving: "Saving…",
    save: "Save",
    cancel: "Cancel",
  },
};

type ServiceRow = Pick<
  Service,
  | "id"
  | "name"
  | "description"
  | "price_minor"
  | "duration_minutes"
  | "active"
  | "image_path"
  | "item_type"
>;

const DURATIONS = Array.from({ length: 96 }, (_, i) => (i + 1) * 5); // 5..480

/** Durata simbolica salvata per i prodotti (la colonna è not null, mai usata). */
const PRODUCT_DURATION = 30;

export function ServicesManager({
  businessId,
  services,
  lang,
}: {
  businessId: string;
  services: ServiceRow[];
  lang: Lang;
}) {
  const t = COPY[lang];
  const router = useRouter();
  const [tab, setTab] = useState<ItemType>("service");
  /** null = chiuso; "new" = creazione; altrimenti id dell'elemento in modifica */
  const [editing, setEditing] = useState<string | null>(null);

  const current = services.find((s) => s.id === editing) ?? null;
  const visible = services.filter((s) => s.item_type === tab);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">{t.heading}</h2>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white"
        >
          {tab === "service" ? t.newService : t.newProduct}
        </button>
      </div>

      <div className="mb-4 flex gap-1 rounded-xl bg-zinc-200/70 p-1 text-sm font-medium">
        {(
          [
            ["service", t.tabServices],
            ["product", t.tabProducts],
          ] as [ItemType, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setTab(value);
              setEditing(null);
            }}
            className={`flex-1 rounded-lg px-3 py-1.5 transition-colors ${
              tab === value ? "bg-white shadow-sm" : "text-zinc-500"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {editing && (
        <ServiceForm
          key={`${tab}-${editing}`}
          businessId={businessId}
          t={t}
          itemType={current?.item_type ?? tab}
          service={current}
          onDone={() => {
            setEditing(null);
            router.refresh();
          }}
          onCancel={() => setEditing(null)}
        />
      )}

      {visible.length === 0 && !editing ? (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-zinc-500 shadow-sm">
          {tab === "service" ? t.emptyServices : t.emptyProducts}
        </p>
      ) : (
        <ul className="space-y-2">
          {visible.map((s) => (
            <li
              key={s.id}
              className={`flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm ${s.active ? "" : "opacity-60"}`}
            >
              {s.image_path ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mediaUrl(s.image_path)!}
                  alt=""
                  className="size-12 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-300">
                  {s.item_type === "product" ? "🛍️" : "✂️"}
                </div>
              )}
              <div className="flex-1">
                <p className="text-base font-semibold text-zinc-900">
                  {s.name}
                  {!s.active && (
                    <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
                      {t.inactive}
                    </span>
                  )}
                </p>
                <p className="text-sm text-zinc-500">
                  {formatEUR(s.price_minor)}
                  {s.item_type === "service" && ` · ${s.duration_minutes} min`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(s.id)}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
              >
                {t.edit}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ServiceForm({
  businessId,
  t,
  itemType,
  service,
  onDone,
  onCancel,
}: {
  businessId: string;
  t: (typeof COPY)[Lang];
  itemType: ItemType;
  service: ServiceRow | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const isProduct = itemType === "product";
  const [name, setName] = useState(service?.name ?? "");
  const [description, setDescription] = useState(service?.description ?? "");
  const [price, setPrice] = useState(
    service ? (service.price_minor / 100).toFixed(2).replace(".", ",") : ""
  );
  const [duration, setDuration] = useState(service?.duration_minutes ?? 30);
  const [active, setActive] = useState(service?.active ?? true);
  const [imagePath, setImagePath] = useState(service?.image_path ?? null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const priceMinor = parseEURToMinor(price);
    if (priceMinor === null) {
      setError(t.priceError);
      return;
    }
    startTransition(async () => {
      let finalImagePath = imagePath;
      if (imageFile) {
        try {
          finalImagePath = await uploadMedia(businessId, "services", imageFile);
        } catch {
          setError(t.uploadError);
          return;
        }
      }
      const result = await saveService({
        id: service?.id,
        name: name.trim(),
        description: description.trim() || null,
        price_minor: priceMinor,
        duration_minutes: isProduct ? PRODUCT_DURATION : duration,
        active,
        image_path: finalImagePath,
        item_type: itemType,
      });
      if (result.error) setError(result.error);
      else onDone();
    });
  }

  const previewUrl = imageFile
    ? URL.createObjectURL(imageFile)
    : mediaUrl(imagePath);

  const editTitle = isProduct ? t.editProduct : t.editService;
  const newTitle = isProduct ? t.newProduct : t.newService;

  return (
    <form
      onSubmit={onSubmit}
      className="mb-4 space-y-3 rounded-2xl bg-white p-4 shadow-sm"
    >
      <p className="font-semibold">{service ? editTitle : newTitle}</p>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">{t.name}</span>
        <input
          required
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
          placeholder={isProduct ? t.productNamePh : t.namePh}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">
          {t.description}
        </span>
        <input
          maxLength={500}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
          placeholder={isProduct ? t.productDescriptionPh : t.descriptionPh}
        />
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="block flex-1">
          <span className="mb-1 block text-sm font-medium">{t.price}</span>
          <input
            required
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
            placeholder="45,00"
          />
        </label>
        {!isProduct && (
          <label className="block flex-1">
            <span className="mb-1 block text-sm font-medium">{t.duration}</span>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-900"
            >
              {DURATIONS.map((d) => (
                <option key={d} value={d}>
                  {d} min
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div>
        <span className="mb-1 block text-sm font-medium">{t.photo}</span>
        <div className="flex items-center gap-3">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt={t.preview}
              className="size-16 rounded-xl object-cover"
            />
          ) : (
            <div className="flex size-16 items-center justify-center rounded-xl bg-zinc-100 text-zinc-300">
              {isProduct ? "🛍️" : "✂️"}
            </div>
          )}
          <div className="space-y-1">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              className="block text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white"
            />
            {(imagePath || imageFile) && (
              <button
                type="button"
                onClick={() => {
                  setImageFile(null);
                  setImagePath(null);
                }}
                className="text-xs text-zinc-500 underline"
              >
                {t.removePhoto}
              </button>
            )}
          </div>
        </div>
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

      <div className="flex gap-2">
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
      </div>
    </form>
  );
}
