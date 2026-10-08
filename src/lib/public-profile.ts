/**
 * Perfil público de um negócio publicado — único shape que rotas públicas
 * retornam (contrato PublicBusinessProfile). Usa o client anon do servidor:
 * a RLS garante que só negócios published (e itens ativos) são legíveis.
 */

import { cache } from "react";
import type { BusinessType, PublicBusinessProfile } from "@/types/database";
import { isPublicBusinessAllowed } from "@/lib/billing";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const DEFAULT_PROFESSIONAL_LABELS: Record<BusinessType, string> = {
  barbershop: "Barbiere",
  beauty: "Professionista",
  hair_salon: "Parrucchiere",
  other: "Professionista",
};

/** cache() deduplica a busca entre generateMetadata e a página na mesma requisição. */
export const getPublicBusinessProfile = cache(
  async (slug: string): Promise<PublicBusinessProfile | null> => {
    const supabase = await createSupabaseServerClient();

    const { data: business } = await supabase
      .from("businesses")
      .select(
        // SEC-003: pix_key NÃO entra no perfil público — só chega ao cliente
        // na resposta da própria reserva (create_booking_hold).
        "id, slug, name, business_type, custom_professional_label, logo_path, cover_path, cover_position, brand_primary, address, whatsapp, timezone, comped, created_at"
      )
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();
    if (!business) return null;

    // Verifica dell'abbonamento IN PARALLELO con servizi/professionisti:
    // un round-trip in meno verso il database per ogni visita pubblica.
    const [allowed, servicesRes, professionalsRes] = await Promise.all([
      isPublicBusinessAllowed(business),
      supabase
        .from("services")
        .select("id, name, description, price_minor, duration_minutes, image_path")
        .eq("business_id", business.id)
        .eq("active", true)
        .order("price_minor"),
      supabase
        .from("professionals")
        .select("id, display_name, image_path")
        .eq("business_id", business.id)
        .eq("active", true)
        .order("display_name"),
    ]);

    // Abbonamento scaduto toglie la pagina dal web (tranne account cortesia)
    if (!allowed) return null;

    return {
      slug: business.slug,
      name: business.name,
      business_type: business.business_type,
      professional_label:
        business.custom_professional_label ??
        DEFAULT_PROFESSIONAL_LABELS[business.business_type as BusinessType],
      logo_path: business.logo_path,
      cover_path: business.cover_path,
      cover_position: business.cover_position ?? 50,
      brand_primary: business.brand_primary,
      address: business.address,
      whatsapp: business.whatsapp,
      timezone: business.timezone,
      services: servicesRes.data ?? [],
      professionals: professionalsRes.data ?? [],
    };
  }
);
