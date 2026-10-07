import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Accedi — Agenda Easy" };

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-zinc-100 px-4 text-zinc-900">
      <Link href="/" className="mb-4 text-xl font-bold tracking-tight">
        agenda<span className="italic text-emerald-900">easy</span>
        <span className="text-orange-600">.</span>
      </Link>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold">Accedi</h1>
        <p className="mb-4 mt-1 text-sm text-zinc-500">
          Entra nel pannello della tua attività.
        </p>
        <AuthForm mode="login" />
        <p className="mt-4 text-center text-sm text-zinc-500">
          Non hai ancora un account?{" "}
          <Link href="/signup" className="font-medium text-zinc-900 underline">
            Crea account
          </Link>
        </p>
      </div>
    </main>
  );
}
