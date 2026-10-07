import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Crea account — Agenda Easy" };

export default function SignupPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-zinc-100 px-4 text-zinc-900">
      <Link href="/" className="mb-4 text-xl font-bold tracking-tight">
        agenda<span className="italic text-emerald-900">easy</span>
        <span className="text-orange-600">.</span>
      </Link>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold">Crea account</h1>
        <p className="mb-4 mt-1 text-sm text-zinc-500">
          Inizia a ricevere prenotazioni online in pochi minuti.
        </p>
        <AuthForm mode="signup" />
        <p className="mt-3 text-center text-xs text-zinc-400">
          Creando l&apos;account accetti i{" "}
          <Link href="/termini" className="underline">
            Termini
          </Link>{" "}
          e la{" "}
          <Link href="/privacy" className="underline">
            Privacy
          </Link>
          .
        </p>
        <p className="mt-4 text-center text-sm text-zinc-500">
          Hai già un account?{" "}
          <Link href="/login" className="font-medium text-zinc-900 underline">
            Accedi
          </Link>
        </p>
      </div>
    </main>
  );
}
