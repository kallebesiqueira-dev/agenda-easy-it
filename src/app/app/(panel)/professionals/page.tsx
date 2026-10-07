import type { Professional, ProfessionalShift } from "@/types/database";
import { getLang } from "@/lib/i18n/server";
import { getCurrentBusiness } from "@/lib/panel/current-business";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProfessionalsManager } from "./professionals-manager";

export default async function ProfessionalsPage() {
  const ctx = (await getCurrentBusiness())!;
  const lang = await getLang();
  const supabase = await createSupabaseServerClient();

  const [professionalsRes, shiftsRes] = await Promise.all([
    supabase
      .from("professionals")
      .select("id, display_name, active, image_path")
      .eq("business_id", ctx.business.id)
      .order("display_name"),
    supabase
      .from("professional_shifts")
      .select("id, professional_id, weekday, starts_at, ends_at")
      .eq("business_id", ctx.business.id)
      .order("weekday")
      .order("starts_at"),
  ]);

  return (
    <ProfessionalsManager
      businessId={ctx.business.id}
      lang={lang}
      label={
        ctx.business.custom_professional_label ??
        (lang === "en" ? "Professional" : "Professionista")
      }
      professionals={
        (professionalsRes.data ?? []) as Pick<
          Professional,
          "id" | "display_name" | "active" | "image_path"
        >[]
      }
      shifts={
        (shiftsRes.data ?? []) as Pick<
          ProfessionalShift,
          "id" | "professional_id" | "weekday" | "starts_at" | "ends_at"
        >[]
      }
    />
  );
}
