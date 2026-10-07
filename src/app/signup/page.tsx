import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Criar conta — Agenda Easy" };

export default function SignupPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-zinc-100 px-4 text-zinc-900">
      <Link href="/" className="mb-4 text-xl font-bold tracking-tight">
        agenda<span className="italic text-emerald-900">easy</span>
        <span className="text-orange-600">.</span>
      </Link>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold">Criar conta</h1>
        <p className="mb-4 mt-1 text-sm text-zinc-500">
          Comece a receber agendamentos online em minutos.
        </p>
        <AuthForm mode="signup" />
        <p className="mt-3 text-center text-xs text-zinc-400">
          Ao criar a conta, você concorda com os{" "}
          <Link href="/termos" className="underline">
            Termos
          </Link>{" "}
          e a{" "}
          <Link href="/privacidade" className="underline">
            Privacidade
          </Link>
          .
        </p>
        <p className="mt-4 text-center text-sm text-zinc-500">
          Já tem conta?{" "}
          <Link href="/login" className="font-medium text-zinc-900 underline">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
