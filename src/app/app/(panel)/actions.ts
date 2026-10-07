"use server";

/**
 * Server Actions do painel. Toda action é um endpoint público: valida a
 * entrada com Zod e deixa a RLS decidir o acesso (client do servidor com a
 * sessão do membro — nunca o admin).
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
  if (!parsed.success) return { error: "Dados inválidos." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("confirm_deposit", {
    p_appointment_id: parsed.data.id,
    p_method: parsed.data.method,
  });

  if (error) {
    if (error.message.includes("invalid_status")) {
      return { error: "Esse agendamento não está mais aguardando sinal." };
    }
    if (error.message.includes("appointment_not_found")) {
      return { error: "Agendamento não encontrado." };
    }
    console.error("confirm_deposit error", error);
    return { error: "Não foi possível confirmar. Tente novamente." };
  }

  revalidatePath("/app");
  return {};
}

/** Transições permitidas por status atual — qualquer outra é rejeitada. */
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
  if (!parsed.success) return { error: "Dados inválidos." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("appointments")
    .update({ status: parsed.data.target })
    .eq("id", parsed.data.id)
    .in("status", ALLOWED_FROM[parsed.data.target])
    .select("id");

  if (error) {
    console.error("setAppointmentStatus error", error);
    return { error: "Não foi possível atualizar. Tente novamente." };
  }
  if (!data || data.length === 0) {
    return { error: "O status desse agendamento mudou. Atualize a página." };
  }

  revalidatePath("/app");
  return {};
}
