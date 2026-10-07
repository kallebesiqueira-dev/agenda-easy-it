"use server";

/**
 * Team e turni. I professionisti non vengono eliminati (FK restrict sulle
 * prenotazioni) — solo disattivati. I turni possono essere rimossi liberamente:
 * le prenotazioni già create conservano l'orario congelato.
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
    return { error: parsed.error.issues[0]?.message ?? "Dati non validi." };
  }

  const ctx = await getCurrentBusiness();
  if (!ctx) return { error: "Sessione scaduta." };

  if (
    parsed.data.image_path &&
    !parsed.data.image_path.startsWith(`${ctx.business.id}/`)
  ) {
    return { error: "Immagine non valida." };
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
      return { error: "Salvataggio non riuscito. Riprova." };
    }
  } else {
    const { data: created, error } = await supabase
      .from("professionals")
      .insert({ ...fields, business_id: ctx.business.id })
      .select("id")
      .single();
    if (error || !created) {
      console.error("saveProfessional error", error);
      return { error: "Salvataggio non riuscito. Riprova." };
    }

    // Turni iniziali che rispecchiano l'orario di apertura (o il default
    // lun–sab 09–18 se non ancora salvato) — senza di questo il professionista
    // non genera nessun orario disponibile e la pagina pubblica resta vuota.
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
      error: parsedShift.error?.issues[0]?.message ?? "Dati non validi.",
    };
  }

  const ctx = await getCurrentBusiness();
  if (!ctx) return { error: "Sessione scaduta." };

  const supabase = await createSupabaseServerClient();

  // La FK non garantisce lo stesso tenant: verifica che il professionista sia di questa attività
  const { data: professional } = await supabase
    .from("professionals")
    .select("id")
    .eq("id", parsedId.data)
    .eq("business_id", ctx.business.id)
    .maybeSingle();
  if (!professional) return { error: "Professionista non trovato." };

  const { error } = await supabase.from("professional_shifts").insert({
    ...parsedShift.data,
    professional_id: parsedId.data,
    business_id: ctx.business.id,
  });
  if (error) {
    console.error("addShift error", error);
    return { error: "Aggiunta del turno non riuscita." };
  }

  revalidatePath("/app/professionals");
  return {};
}

export async function deleteShift(
  shiftId: string
): Promise<{ error?: string }> {
  const parsed = uuidSchema.safeParse(shiftId);
  if (!parsed.success) return { error: "Dati non validi." };

  const ctx = await getCurrentBusiness();
  if (!ctx) return { error: "Sessione scaduta." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("professional_shifts")
    .delete()
    .eq("id", parsed.data)
    .eq("business_id", ctx.business.id);
  if (error) {
    console.error("deleteShift error", error);
    return { error: "Rimozione del turno non riuscita." };
  }

  revalidatePath("/app/professionals");
  return {};
}
