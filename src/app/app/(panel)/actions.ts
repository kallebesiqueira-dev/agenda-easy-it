"use server";

/**
 * Server Actions del pannello. Ogni action è un endpoint pubblico: valida
 * l'input con Zod e lascia che la RLS decida l'accesso (client del server con
 * la sessione del membro — mai l'admin).
 */

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { AppointmentStatus } from "@/types/database";
import { paymentMethodSchema, uuidSchema } from "@/lib/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface ActionResult {
  error?: string;
}

export async function confirmDeposit(
  appointmentId: string,
  method: string
): Promise<ActionResult> {
  const parsed = z
    .object({ id: uuidSchema, method: paymentMethodSchema })
    .safeParse({ id: appointmentId, method });
  if (!parsed.success) return { error: "Dati non validi." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("confirm_deposit", {
    p_appointment_id: parsed.data.id,
    p_method: parsed.data.method,
  });

  if (error) {
    if (error.message.includes("invalid_status")) {
      return { error: "Questa prenotazione non è più in attesa di acconto." };
    }
    if (error.message.includes("appointment_not_found")) {
      return { error: "Prenotazione non trovata." };
    }
    console.error("confirm_deposit error", error);
    return { error: "Conferma non riuscita. Riprova." };
  }

  revalidatePath("/app");
  return {};
}

/** Transizioni consentite per stato attuale — qualsiasi altra viene rifiutata. */
const ALLOWED_FROM: Record<string, AppointmentStatus[]> = {
  cancelled: ["awaiting_deposit", "confirmed"],
  completed: ["confirmed"],
  no_show: ["confirmed"],
};

export async function setAppointmentStatus(
  appointmentId: string,
  target: string
): Promise<ActionResult> {
  const parsed = z
    .object({
      id: uuidSchema,
      target: z.enum(["cancelled", "completed", "no_show"]),
    })
    .safeParse({ id: appointmentId, target });
  if (!parsed.success) return { error: "Dati non validi." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("appointments")
    .update({ status: parsed.data.target })
    .eq("id", parsed.data.id)
    .in("status", ALLOWED_FROM[parsed.data.target])
    .select("id");

  if (error) {
    console.error("setAppointmentStatus error", error);
    return { error: "Aggiornamento non riuscito. Riprova." };
  }
  if (!data || data.length === 0) {
    return { error: "Lo stato di questa prenotazione è cambiato. Ricarica la pagina." };
  }

  revalidatePath("/app");
  return {};
}
