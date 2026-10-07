"use server";

import { revalidatePath } from "next/cache";
import { actionMessages } from "@/lib/i18n/messages";
import { getLang } from "@/lib/i18n/server";
import { getCurrentBusiness } from "@/lib/panel/current-business";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { businessSettingsSchema } from "@/lib/validation";

export async function saveSettings(
  input: unknown
): Promise<{ error?: string }> {
  const t = actionMessages(await getLang());
  const parsed = businessSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? t.invalidData };
  }

  const ctx = await getCurrentBusiness();
  if (!ctx) return { error: t.sessionExpired };

  for (const path of [parsed.data.logo_path, parsed.data.cover_path]) {
    if (path && !path.startsWith(`${ctx.business.id}/`)) {
      return { error: t.imageInvalid };
    }
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("businesses")
    .update(parsed.data)
    .eq("id", ctx.business.id);

  if (error) {
    console.error("saveSettings error", error);
    return { error: t.saveFailed };
  }

  revalidatePath("/app/settings");
  revalidatePath("/app");
  return {};
}
