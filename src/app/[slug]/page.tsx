import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLang } from "@/lib/i18n/server";
import { getPublicBusinessProfile } from "@/lib/public-profile";
import { BookingFlow } from "./booking-flow";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getPublicBusinessProfile(slug);
  if (!profile) return { title: "Agenda Easy" };
  return {
    title: `${profile.name} — Prenota un appuntamento`,
    description: `Prenota il tuo appuntamento da ${profile.name} con Agenda Easy.`,
  };
}

export default async function PublicBookingPage({ params }: Props) {
  const { slug } = await params;
  const [profile, lang] = await Promise.all([
    getPublicBusinessProfile(slug),
    getLang(),
  ]);
  if (!profile) notFound();

  return <BookingFlow profile={profile} lang={lang} />;
}
