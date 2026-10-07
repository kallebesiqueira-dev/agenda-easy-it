/**
 * Mídia pública (bucket "media"): logo do negócio e fotos de serviços.
 * Caminho sempre começa com o business_id — é isso que as policies do
 * Storage usam para autorizar a escrita.
 */

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

/** URL pública de um objeto do bucket media (null-safe). */
export function mediaUrl(path: string | null): string | null {
  if (!path) return null;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/${path}`;
}

/** Sobe uma imagem (browser) e retorna o path salvo. Lança em erro. */
export async function uploadMedia(
  businessId: string,
  folder: "logo" | "services" | "team" | "cover",
  file: File
): Promise<string> {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${businessId}/${folder}/${crypto.randomUUID()}.${ext}`;
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.storage
    .from("media")
    .upload(path, file, { cacheControl: "3600", contentType: file.type });
  if (error) throw new Error(error.message);
  return path;
}
