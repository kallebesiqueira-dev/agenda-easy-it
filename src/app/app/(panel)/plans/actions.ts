"use server";

/**
 * CRUD dei piani/promozioni. A differenza dei servizi, i piani non sono
 * referenziati dalle prenotazioni: l'eliminazione è consentita.
 */

import { revalidatePath } from "next/cache";
import { actionMessages } from "@/lib/i18n/messages";
import { getLang } from "@/lib/i18n/server";
import { getCurrentBusiness } from "@/lib/panel/current-business";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { planInputSchema, uuidSchema } from "@/lib/validation";

export interface SavePlanInput {
  id?: string;
  title: string;
  description: string | null;
  price_minor: number | null;
  price_suffix: string | null;
  badge: string | null;
  active: boolean;
  sort_order: number;
}

export async function savePlan(
  input: SavePlanInput
): Promise<{ error?: string }> {
  const t = actionMessages(await getLang());
  const parsed = planInputSchema
    .extend({ id: uuidSchema.optional() })
    .safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? t.invalidData };
  }

  const ctx = await getCurrentBusiness();
  if (!ctx) return { error: t.sessionExpired };

  const supabase = await createSupabaseServerClient();
  const { id, ...fields } = parsed.data;

  const { error } = id
    ? await supabase
        .from("plans")
        .update(fields)
        .eq("id", id)
        .eq("business_id", ctx.business.id)
    : await supabase
        .from("plans")
        .insert({ ...fields, business_id: ctx.business.id });

  if (error) {
    console.error("savePlan error", error);
    return { error: t.saveFailed };
  }

  revalidatePath("/app/plans");
  return {};
}

export async function deletePlan(id: string): Promise<{ error?: string }> {
  const t = actionMessages(await getLang());
  const parsed = uuidSchema.safeParse(id);
  if (!parsed.success) return { error: t.invalidData };

  const ctx = await getCurrentBusiness();
  if (!ctx) return { error: t.sessionExpired };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("plans")
    .delete()
    .eq("id", parsed.data)
    .eq("business_id", ctx.business.id);

  if (error) {
    console.error("deletePlan error", error);
    return { error: t.saveFailed };
  }

  revalidatePath("/app/plans");
  return {};
}
