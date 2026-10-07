"use server";

/**
 * CRUD de serviços. Exclusão não existe: agendamentos passados referenciam o
 * serviço (FK restrict) — desativar tira da página pública e preserva o
 * histórico.
 */

import { revalidatePath } from "next/cache";
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
  const parsed = serviceInputSchema
    .extend({ id: uuidSchema.optional() })
    .safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const ctx = await getCurrentBusiness();
  if (!ctx) return { error: "Sessão expirada." };

  // Imagem precisa estar na pasta deste negócio no Storage
  if (
    parsed.data.image_path &&
    !parsed.data.image_path.startsWith(`${ctx.business.id}/`)
  ) {
    return { error: "Imagem inválida." };
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
    return { error: "Não foi possível salvar. Tente novamente." };
  }

  revalidatePath("/app/services");
  return {};
}
