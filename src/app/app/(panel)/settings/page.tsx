import { getCurrentBusiness } from "@/lib/panel/current-business";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const ctx = (await getCurrentBusiness())!;
  const b = ctx.business;

  return (
    <SettingsForm
      businessId={b.id}
      initial={{
        name: b.name,
        logo_path: b.logo_path,
        cover_path: b.cover_path,
        cover_position: b.cover_position ?? 50,
        business_type: b.business_type,
        custom_professional_label: b.custom_professional_label,
        brand_primary: b.brand_primary,
        address: b.address,
        phone: b.phone,
        whatsapp: b.whatsapp,
        pix_key: b.pix_key,
        published: b.published,
      }}
      slug={b.slug}
    />
  );
}
