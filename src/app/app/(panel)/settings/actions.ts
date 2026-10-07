"use server";

import { revalidatePath } from "next/cache";
import { getCurrentBusiness } from "@/lib/panel/current-business";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { businessSettingsSchema } from "@/lib/validation";

export async function saveSettings(
  input: unknown
): Promise<{ error?: string }> {
  const parsed = businessSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dati non validi." };
  }

  const ctx = await getCurrentBusiness();
  if (!ctx) return { error: "Sessione scaduta." };

  for (const path of [parsed.data.logo_path, parsed.data.cover_path]) {
    if (path && !path.startsWith(`${ctx.business.id}/`)) {
      return { error: "Immagine non valida." };
    }
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("businesses")
    .update(parsed.data)
    .eq("id", ctx.business.id);

  if (error) {
    console.error("saveSettings error", error);
    return { error: "Salvataggio non riuscito. Riprova." };
  }

  revalidatePath("/app/settings");
  revalidatePath("/app");
  return {};
}
