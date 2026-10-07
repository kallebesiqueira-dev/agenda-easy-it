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
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const ctx = await getCurrentBusiness();
  if (!ctx) return { error: "Sessão expirada." };

  for (const path of [parsed.data.logo_path, parsed.data.cover_path]) {
    if (path && !path.startsWith(`${ctx.business.id}/`)) {
      return { error: "Imagem inválida." };
    }
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("businesses")
    .update(parsed.data)
    .eq("id", ctx.business.id);

  if (error) {
    console.error("saveSettings error", error);
    return { error: "Não foi possível salvar. Tente novamente." };
  }

  revalidatePath("/app/settings");
  revalidatePath("/app");
  return {};
}
