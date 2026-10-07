"use server";

/**
 * Equipe e turnos. Profissionais não são excluídos (FK restrict em
 * agendamentos) — apenas desativados. Turnos podem ser removidos livremente:
 * agendamentos já criados guardam o horário congelado.
 */

import { revalidatePath } from "next/cache";
import { getCurrentBusiness } from "@/lib/panel/current-business";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  professionalInputSchema,
  shiftInputSchema,
  uuidSchema,
} from "@/lib/validation";

export async function saveProfessional(input: {
  id?: string;
  display_name: string;
  active: boolean;
  image_path?: string | null;
}): Promise<{ error?: string }> {
  const parsed = professionalInputSchema
    .extend({ id: uuidSchema.optional() })
    .safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const ctx = await getCurrentBusiness();
  if (!ctx) return { error: "Sessão expirada." };

  if (
    parsed.data.image_path &&
    !parsed.data.image_path.startsWith(`${ctx.business.id}/`)
  ) {
    return { error: "Imagem inválida." };
  }

  const supabase = await createSupabaseServerClient();
  const { id, ...fields } = parsed.data;

  if (id) {
    const { error } = await supabase
      .from("professionals")
      .update(fields)
      .eq("id", id)
      .eq("business_id", ctx.business.id);
    if (error) {
      console.error("saveProfessional error", error);
      return { error: "Não foi possível salvar. Tente novamente." };
    }
  } else {
    const { data: created, error } = await supabase
      .from("professionals")
      .insert({ ...fields, business_id: ctx.business.id })
      .select("id")
      .single();
    if (error || !created) {
      console.error("saveProfessional error", error);
      return { error: "Não foi possível salvar. Tente novamente." };
    }

    // Turnos iniciais espelhando o horário de funcionamento (ou padrão
    // seg–sáb 09–18 se ainda não salvo) — sem isso o profissional não
    // gera nenhum horário disponível e a página pública fica vazia.
    const { data: hours } = await supabase
      .from("business_hours")
      .select("weekday, opens_at, closes_at, is_closed")
      .eq("business_id", ctx.business.id);
    const openDays =
      hours && hours.length > 0
        ? hours.filter((h) => !h.is_closed)
        : [1, 2, 3, 4, 5, 6].map((weekday) => ({
            weekday,
            opens_at: "09:00",
            closes_at: "18:00",
          }));
    if (openDays.length > 0) {
      const { error: shiftsError } = await supabase
        .from("professional_shifts")
        .insert(
          openDays.map((h) => ({
            business_id: ctx.business.id,
            professional_id: created.id,
            weekday: h.weekday,
            starts_at: h.opens_at,
            ends_at: h.closes_at,
          }))
        );
      if (shiftsError) console.error("default shifts error", shiftsError);
    }
  }

  revalidatePath("/app/professionals");
  return {};
}

export async function addShift(input: {
  professional_id: string;
  weekday: number;
  starts_at: string;
  ends_at: string;
}): Promise<{ error?: string }> {
  const parsedId = uuidSchema.safeParse(input.professional_id);
  const parsedShift = shiftInputSchema.safeParse(input);
  if (!parsedId.success || !parsedShift.success) {
    return {
      error: parsedShift.error?.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const ctx = await getCurrentBusiness();
  if (!ctx) return { error: "Sessão expirada." };

  const supabase = await createSupabaseServerClient();

  // FK não garante mesmo tenant: confere que o profissional é deste negócio
  const { data: professional } = await supabase
    .from("professionals")
    .select("id")
    .eq("id", parsedId.data)
    .eq("business_id", ctx.business.id)
    .maybeSingle();
  if (!professional) return { error: "Profissional não encontrado." };

  const { error } = await supabase.from("professional_shifts").insert({
    ...parsedShift.data,
    professional_id: parsedId.data,
    business_id: ctx.business.id,
  });
  if (error) {
    console.error("addShift error", error);
    return { error: "Não foi possível adicionar o turno." };
  }

  revalidatePath("/app/professionals");
  return {};
}

export async function deleteShift(
  shiftId: string
): Promise<{ error?: string }> {
  const parsed = uuidSchema.safeParse(shiftId);
  if (!parsed.success) return { error: "Dados inválidos." };

  const ctx = await getCurrentBusiness();
  if (!ctx) return { error: "Sessão expirada." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("professional_shifts")
    .delete()
    .eq("id", parsed.data)
    .eq("business_id", ctx.business.id);
  if (error) {
    console.error("deleteShift error", error);
    return { error: "Não foi possível remover o turno." };
  }

  revalidatePath("/app/professionals");
  return {};
}
