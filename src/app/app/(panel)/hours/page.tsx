import type { Break, BusinessHour } from "@/types/database";
import { getLang } from "@/lib/i18n/server";
import { getCurrentBusiness } from "@/lib/panel/current-business";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { HoursManager } from "./hours-manager";

export default async function HoursPage() {
  const ctx = (await getCurrentBusiness())!;
  const lang = await getLang();
  const supabase = await createSupabaseServerClient();

  const [hoursRes, breaksRes, prosRes] = await Promise.all([
    supabase
      .from("business_hours")
      .select("weekday, opens_at, closes_at, is_closed")
      .eq("business_id", ctx.business.id),
    supabase
      .from("breaks")
      .select("id, weekday, starts_at, ends_at, professional_id")
      .eq("business_id", ctx.business.id)
      .order("weekday")
      .order("starts_at"),
    supabase
      .from("professionals")
      .select("id, display_name")
      .eq("business_id", ctx.business.id)
      .eq("active", true)
      .order("display_name"),
  ]);

  return (
    <HoursManager
      lang={lang}
      hours={
        (hoursRes.data ?? []) as Pick<
          BusinessHour,
          "weekday" | "opens_at" | "closes_at" | "is_closed"
        >[]
      }
      breaks={
        (breaksRes.data ?? []) as Pick<
          Break,
          "id" | "weekday" | "starts_at" | "ends_at" | "professional_id"
        >[]
      }
      professionals={(prosRes.data ?? []) as { id: string; display_name: string }[]}
    />
  );
}
