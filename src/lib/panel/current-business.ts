/**
 * Contexto do painel: usuário logado + negócio do qual é membro.
 * cache() deduplica entre layout e página na mesma requisição.
 * MVP: um negócio por usuário (pega o primeiro vínculo aceito).
 */

import { cache } from "react";
import type { Business, MemberRole } from "@/types/database";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface PanelContext {
  userId: string;
  role: MemberRole;
  business: Business;
}

export const getCurrentBusiness = cache(
  async (): Promise<PanelContext | null> => {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from("business_members")
      .select("role, business:businesses(*)")
      .eq("user_id", user.id)
      .eq("invite_status", "accepted")
      .order("created_at", { ascending: true }) // vínculo mais antigo = negócio "principal"
      .limit(1)
      .maybeSingle();
    if (!data?.business) return null;

    return {
      userId: user.id,
      role: data.role as MemberRole,
      business: data.business as unknown as Business,
    };
  }
);
