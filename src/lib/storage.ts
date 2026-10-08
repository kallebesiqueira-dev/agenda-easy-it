/**
 * Media pubblica (bucket "media"): logo, copertina, foto di servizi e team.
 * Il percorso inizia sempre con il business_id — è ciò che le policy dello
 * Storage usano per autorizzare la scrittura.
 *
 * Prima dell'upload l'immagine viene COMPRESSA nel browser (ridimensionamento
 * + WebP): le foto da smartphone pesano 5–10 MB e rendevano il salvataggio
 * lento; così si caricano decine di KB mantenendo qualità e trasparenza.
 */

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

/** URL pubblico di un oggetto del bucket media (null-safe). */
export function mediaUrl(path: string | null): string | null {
  if (!path) return null;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/${path}`;
}

type MediaFolder = "logo" | "services" | "team" | "cover";

/** Lato massimo per cartella — oltre non serve a nessun layout dell'app. */
const MAX_DIM: Record<MediaFolder, number> = {
  logo: 512,
  services: 1000,
  team: 512,
  cover: 1600,
};

const WEBP_QUALITY = 0.85;

/**
 * Ridimensiona e ricodifica in WebP (mantiene la trasparenza dei PNG).
 * In caso di qualsiasi problema — o se non conviene — restituisce l'originale.
 */
async function compressImage(file: File, maxDim: number): Promise<File> {
  try {
    if (!file.type.startsWith("image/")) return file;
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", WEBP_QUALITY)
    );
    // Browser senza WebP o risultato più pesante dell'originale: usa l'originale
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], "image.webp", { type: "image/webp" });
  } catch {
    return file;
  }
}

/** Carica un'immagine (browser) e restituisce il path salvato. Lancia in errore. */
export async function uploadMedia(
  businessId: string,
  folder: MediaFolder,
  file: File
): Promise<string> {
  const prepared = await compressImage(file, MAX_DIM[folder]);
  const ext = (prepared.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${businessId}/${folder}/${crypto.randomUUID()}.${ext}`;
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.storage
    .from("media")
    .upload(path, prepared, { cacheControl: "3600", contentType: prepared.type });
  if (error) throw new Error(error.message);
  return path;
}
