"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Service } from "@/types/database";
import type { Lang } from "@/lib/i18n";
import { formatEUR, parseEURToMinor } from "@/lib/money";
import { mediaUrl, uploadMedia } from "@/lib/storage";
import { saveService } from "./actions";

const COPY: Record<
  Lang,
  {
    heading: string;
    newService: string;
    empty: string;
    inactive: string;
    edit: string;
    priceError: string;
    uploadError: string;
    editService: string;
    name: string;
    namePh: string;
    description: string;
    descriptionPh: string;
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
    heading: "Servizi",
    newService: "Nuovo servizio",
    empty: "Inserisci il tuo primo servizio per comparire nella pagina di prenotazione.",
    inactive: "non attivo",
    edit: "Modifica",
    priceError: "Prezzo non valido. Es.: 45,00",
    uploadError: "Caricamento della foto non riuscito. Riprova.",
    editService: "Modifica servizio",
    name: "Nome",
    namePh: "Taglio uomo",
    description: "Descrizione (opzionale)",
    descriptionPh: "Forbici e macchinetta",
    price: "Prezzo (€)",
    duration: "Durata",
    photo: "Foto (opzionale)",
    preview: "Anteprima",
    removePhoto: "Rimuovi foto",
    visible: "Visibile nella pagina di prenotazione",
    saving: "Salvataggio…",
    save: "Salva",
    cancel: "Annulla",
  },
  en: {
    heading: "Services",
    newService: "New service",
    empty: "Add your first service to appear on the booking page.",
    inactive: "inactive",
    edit: "Edit",
    priceError: "Invalid price. E.g.: 45,00",
    uploadError: "Couldn't upload the photo. Please try again.",
    editService: "Edit service",
    name: "Name",
    namePh: "Men's haircut",
    description: "Description (optional)",
    descriptionPh: "Scissors and clippers",
    price: "Price (€)",
    duration: "Duration",
    photo: "Photo (optional)",
    preview: "Preview",
    removePhoto: "Remove photo",
    visible: "Visible on the booking page",
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
>;

const DURATIONS = Array.from({ length: 96 }, (_, i) => (i + 1) * 5); // 5..480

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
  /** null = chiuso; "new" = creazione; altrimenti id del servizio in modifica */
  const [editing, setEditing] = useState<string | null>(null);

  const current = services.find((s) => s.id === editing) ?? null;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">{t.heading}</h2>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white"
        >
          {t.newService}
        </button>
      </div>

      {editing && (
        <ServiceForm
          key={editing}
          businessId={businessId}
          t={t}
          service={current}
          onDone={() => {
            setEditing(null);
            router.refresh();
          }}
          onCancel={() => setEditing(null)}
        />
      )}

      {services.length === 0 && !editing ? (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-zinc-500 shadow-sm">
          {t.empty}
        </p>
      ) : (
        <ul className="space-y-2">
          {services.map((s) => (
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
                  ✂️
                </div>
              )}
              <div className="flex-1">
                <p className="font-medium">
                  {s.name}
                  {!s.active && (
                    <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
                      {t.inactive}
                    </span>
                  )}
                </p>
                <p className="text-sm text-zinc-500">
                  {formatEUR(s.price_minor)} · {s.duration_minutes} min
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
  service,
  onDone,
  onCancel,
}: {
  businessId: string;
  t: (typeof COPY)[Lang];
  service: ServiceRow | null;
  onDone: () => void;
  onCancel: () => void;
}) {
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
        duration_minutes: duration,
        active,
        image_path: finalImagePath,
      });
      if (result.error) setError(result.error);
      else onDone();
    });
  }

  const previewUrl = imageFile
    ? URL.createObjectURL(imageFile)
    : mediaUrl(imagePath);

  return (
    <form
      onSubmit={onSubmit}
      className="mb-4 space-y-3 rounded-2xl bg-white p-4 shadow-sm"
    >
      <p className="font-semibold">{service ? t.editService : t.newService}</p>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">{t.name}</span>
        <input
          required
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
          placeholder={t.namePh}
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
          placeholder={t.descriptionPh}
        />
      </label>
      <div className="flex gap-3">
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
              ✂️
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
