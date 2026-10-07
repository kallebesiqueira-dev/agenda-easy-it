import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
    title: `${profile.name} — Agendar horário`,
    description: `Agende seu horário em ${profile.name} pelo Agenda Easy.`,
  };
}

export default async function PublicBookingPage({ params }: Props) {
  const { slug } = await params;
  const profile = await getPublicBusinessProfile(slug);
  if (!profile) notFound();

  return <BookingFlow profile={profile} />;
}
