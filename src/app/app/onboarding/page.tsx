import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentBusiness } from "@/lib/panel/current-business";
import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = { title: "Crea attività — Agenda Easy" };

export default async function OnboardingPage() {
  // Chi ha già un'attività non ripassa di qui
  const ctx = await getCurrentBusiness();
  if (ctx) redirect("/app");

  return (
    <main className="flex min-h-dvh items-center justify-center bg-zinc-100 px-4 text-zinc-900">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold">Crea la tua attività</h1>
        <p className="mb-4 mt-1 text-sm text-zinc-500">
          Questi dati compaiono nella tua pagina di prenotazione. Potrai
          modificarli in seguito.
        </p>
        <OnboardingForm />
      </div>
    </main>
  );
}
