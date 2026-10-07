"use server";

/**
 * CRUD dei servizi. L'eliminazione non esiste: le prenotazioni passate
 * referenziano il servizio (FK restrict) — disattivarlo lo toglie dalla
 * pagina pubblica e preserva lo storico.
 */

import { revalidatePath } from "next/cache";
import { actionMessages } from "@/lib/i18n/messages";
import { getLang } from "@/lib/i18n/server";
import { getCurrentBusiness } from "@/lib/panel/current-business";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { serviceInputSchema, uuidSchema } from "@/lib/validation";

export interface SaveServiceInput {
  id?: string;
  name: string;
  description: string | null;
  price_minor: number;
  duration_minutes: number;
  active: boolean;
  image_path: string | null;
}

export async function saveService(
  input: SaveServiceInput
): Promise<{ error?: string }> {
  const t = actionMessages(await getLang());
  const parsed = serviceInputSchema
    .extend({ id: uuidSchema.optional() })
    .safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? t.invalidData };
  }

  const ctx = await getCurrentBusiness();
  if (!ctx) return { error: t.sessionExpired };

  // L'immagine deve stare nella cartella di questa attività nello Storage
  if (
    parsed.data.image_path &&
    !parsed.data.image_path.startsWith(`${ctx.business.id}/`)
  ) {
    return { error: t.imageInvalid };
  }

  const supabase = await createSupabaseServerClient();
  const { id, ...fields } = parsed.data;

  const { error } = id
    ? await supabase
        .from("services")
        .update(fields)
        .eq("id", id)
        .eq("business_id", ctx.business.id)
    : await supabase
        .from("services")
        .insert({ ...fields, business_id: ctx.business.id });

  if (error) {
    console.error("saveService error", error);
    return { error: t.saveFailed };
  }

  revalidatePath("/app/services");
  return {};
}
