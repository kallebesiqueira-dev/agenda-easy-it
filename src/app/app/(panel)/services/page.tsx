import type { Service } from "@/types/database";
import { getLang } from "@/lib/i18n/server";
import { getCurrentBusiness } from "@/lib/panel/current-business";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ServicesManager } from "./services-manager";

export default async function ServicesPage() {
  const ctx = (await getCurrentBusiness())!;
  const lang = await getLang();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("services")
    .select("id, name, description, price_minor, duration_minutes, active, image_path")
    .eq("business_id", ctx.business.id)
    .order("name");

  return (
    <ServicesManager
      businessId={ctx.business.id}
      lang={lang}
      services={(data ?? []) as Pick<
        Service,
        | "id"
        | "name"
        | "description"
        | "price_minor"
        | "duration_minutes"
        | "active"
        | "image_path"
      >[]}
    />
  );
}
