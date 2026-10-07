"use server";

/**
 * Orari di apertura (1 riga per giorno, upsert) e pause generali
 * dell'attività (professional_id null — valgono per tutto il team, es.: pranzo).
 */

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { actionMessages } from "@/lib/i18n/messages";
import { getLang } from "@/lib/i18n/server";
import { getCurrentBusiness } from "@/lib/panel/current-business";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  businessHourInputSchema,
  shiftInputSchema,
  uuidSchema,
} from "@/lib/validation";

const weekSchema = z.array(businessHourInputSchema).length(7);

export async function saveBusinessHours(
  hours: unknown
): Promise<{ error?: string }> {
  const t = actionMessages(await getLang());
  const parsed = weekSchema.safeParse(hours);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? t.invalidData };
  }

  const ctx = await getCurrentBusiness();
  if (!ctx) return { error: t.sessionExpired };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("business_hours").upsert(
    parsed.data.map((h) => ({ ...h, business_id: ctx.business.id })),
    { onConflict: "business_id,weekday" }
  );
  if (error) {
    console.error("saveBusinessHours error", error);
    return { error: t.saveFailed };
  }

  revalidatePath("/app/hours");
  return {};
}

export async function addBreak(input: {
  weekday: number;
  starts_at: string;
  ends_at: string;
  /** null/assente = pausa generale (tutto il team) */
  professional_id?: string | null;
}): Promise<{ error?: string }> {
  const t = actionMessages(await getLang());
  const parsed = shiftInputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? t.invalidData };
  }
  const professionalId = input.professional_id ?? null;
  if (professionalId !== null && !uuidSchema.safeParse(professionalId).success) {
    return { error: t.invalidData };
  }

  const ctx = await getCurrentBusiness();
  if (!ctx) return { error: t.sessionExpired };

  const supabase = await createSupabaseServerClient();
  if (professionalId !== null) {
    const { data: pro } = await supabase
      .from("professionals")
      .select("id")
      .eq("id", professionalId)
      .eq("business_id", ctx.business.id)
      .maybeSingle();
    if (!pro) return { error: t.professionalInvalid };
  }
  const { error } = await supabase.from("breaks").insert({
    ...parsed.data,
    business_id: ctx.business.id,
    professional_id: professionalId,
  });
  if (error) {
    console.error("addBreak error", error);
    return { error: t.addBreakFailed };
  }

  revalidatePath("/app/hours");
  return {};
}

export async function deleteBreak(
  breakId: string
): Promise<{ error?: string }> {
  const t = actionMessages(await getLang());
  const parsed = uuidSchema.safeParse(breakId);
  if (!parsed.success) return { error: t.invalidData };

  const ctx = await getCurrentBusiness();
  if (!ctx) return { error: t.sessionExpired };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("breaks")
    .delete()
    .eq("id", parsed.data)
    .eq("business_id", ctx.business.id);
  if (error) {
    console.error("deleteBreak error", error);
    return { error: t.removeBreakFailed };
  }

  revalidatePath("/app/hours");
  return {};
}
