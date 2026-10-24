"use server";

/**
 * Server Actions del pannello. Ogni action è un endpoint pubblico: valida
 * l'input con Zod e lascia che la RLS decida l'accesso (client del server con
 * la sessione del membro — mai l'admin).
 */

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { AppointmentStatus } from "@/types/database";
import { actionMessages } from "@/lib/i18n/messages";
import { getLang } from "@/lib/i18n/server";
import { uuidSchema } from "@/lib/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface ActionResult {
  error?: string;
}

/** Transizioni consentite per stato attuale — qualsiasi altra viene rifiutata. */
const ALLOWED_FROM: Record<string, AppointmentStatus[]> = {
  cancelled: ["confirmed"],
  completed: ["confirmed"],
  no_show: ["confirmed"],
};

export async function setAppointmentStatus(
  appointmentId: string,
  target: string
): Promise<ActionResult> {
  const t = actionMessages(await getLang());
  const parsed = z
    .object({
      id: uuidSchema,
      target: z.enum(["cancelled", "completed", "no_show"]),
    })
    .safeParse({ id: appointmentId, target });
  if (!parsed.success) return { error: t.invalidData };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("appointments")
    .update({ status: parsed.data.target })
    .eq("id", parsed.data.id)
    .in("status", ALLOWED_FROM[parsed.data.target])
    .select("id");

  if (error) {
    console.error("setAppointmentStatus error", error);
    return { error: t.updateFailed };
  }
  if (!data || data.length === 0) {
    return { error: t.statusChanged };
  }

  revalidatePath("/app");
  return {};
}
