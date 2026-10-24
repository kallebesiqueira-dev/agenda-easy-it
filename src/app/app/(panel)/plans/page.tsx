import type { Plan } from "@/types/database";
import { getLang } from "@/lib/i18n/server";
import { getCurrentBusiness } from "@/lib/panel/current-business";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PlansManager } from "./plans-manager";

export default async function PlansPage() {
  const ctx = (await getCurrentBusiness())!;
  const lang = await getLang();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("plans")
    .select(
      "id, title, description, price_minor, price_suffix, badge, active, sort_order"
    )
    .eq("business_id", ctx.business.id)
    .order("sort_order");

  return (
    <PlansManager
      lang={lang}
      plans={(data ?? []) as Pick<
        Plan,
        | "id"
        | "title"
        | "description"
        | "price_minor"
        | "price_suffix"
        | "badge"
        | "active"
        | "sort_order"
      >[]}
    />
  );
}
