import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentBusiness } from "@/lib/panel/current-business";
import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = { title: "Criar negócio — Agenda Easy" };

export default async function OnboardingPage() {
  // Quem já tem negócio não passa por aqui de novo
  const ctx = await getCurrentBusiness();
  if (ctx) redirect("/app");

  return (
    <main className="flex min-h-dvh items-center justify-center bg-zinc-100 px-4 text-zinc-900">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold">Crie seu negócio</h1>
        <p className="mb-4 mt-1 text-sm text-zinc-500">
          Esses dados aparecem na sua página de agendamento. Dá para mudar
          depois.
        </p>
        <OnboardingForm />
      </div>
    </main>
  );
}
