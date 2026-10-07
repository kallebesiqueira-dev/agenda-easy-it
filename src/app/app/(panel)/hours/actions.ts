"use server";

/**
 * Horário de funcionamento (1 linha por dia, upsert) e pausas gerais do
 * negócio (professional_id null — valem para toda a equipe, ex.: almoço).
 */

import { revalidatePath } from "next/cache";
import { z } from "zod";
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
  const parsed = weekSchema.safeParse(hours);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const ctx = await getCurrentBusiness();
  if (!ctx) return { error: "Sessão expirada." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("business_hours").upsert(
    parsed.data.map((h) => ({ ...h, business_id: ctx.business.id })),
    { onConflict: "business_id,weekday" }
  );
  if (error) {
    console.error("saveBusinessHours error", error);
    return { error: "Não foi possível salvar. Tente novamente." };
  }

  revalidatePath("/app/hours");
  return {};
}

export async function addBreak(input: {
  weekday: number;
  starts_at: string;
  ends_at: string;
  /** null/ausente = pausa geral (toda a equipe) */
  professional_id?: string | null;
}): Promise<{ error?: string }> {
  const parsed = shiftInputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const professionalId = input.professional_id ?? null;
  if (professionalId !== null && !uuidSchema.safeParse(professionalId).success) {
    return { error: "Dados inválidos." };
  }

  const ctx = await getCurrentBusiness();
  if (!ctx) return { error: "Sessão expirada." };

  const supabase = await createSupabaseServerClient();
  if (professionalId !== null) {
    const { data: pro } = await supabase
      .from("professionals")
      .select("id")
      .eq("id", professionalId)
      .eq("business_id", ctx.business.id)
      .maybeSingle();
    if (!pro) return { error: "Profissional inválido." };
  }
  const { error } = await supabase.from("breaks").insert({
    ...parsed.data,
    business_id: ctx.business.id,
    professional_id: professionalId,
  });
  if (error) {
    console.error("addBreak error", error);
    return { error: "Não foi possível adicionar a pausa." };
  }

  revalidatePath("/app/hours");
  return {};
}

export async function deleteBreak(
  breakId: string
): Promise<{ error?: string }> {
  const parsed = uuidSchema.safeParse(breakId);
  if (!parsed.success) return { error: "Dados inválidos." };

  const ctx = await getCurrentBusiness();
  if (!ctx) return { error: "Sessão expirada." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("breaks")
    .delete()
    .eq("id", parsed.data)
    .eq("business_id", ctx.business.id);
  if (error) {
    console.error("deleteBreak error", error);
    return { error: "Não foi possível remover a pausa." };
  }

  revalidatePath("/app/hours");
  return {};
}
