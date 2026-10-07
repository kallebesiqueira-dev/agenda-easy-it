"use client";

import { useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/redefinir-senha`,
    });
    setLoading(false);
    if (error) {
      setError("Não foi possível enviar. Confira o e-mail e tente de novo.");
      return;
    }
    setSent(true);
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-zinc-100 px-4 text-zinc-900">
      <Link href="/" className="mb-4 text-xl font-bold tracking-tight">
        agenda<span className="italic text-emerald-900">easy</span>
        <span className="text-orange-600">.</span>
      </Link>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold">Recuperar senha</h1>
        <p className="mb-4 mt-1 text-sm text-zinc-500">
          Enviaremos um link para você criar uma nova senha.
        </p>

        {sent ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Se existir uma conta com esse e-mail, o link foi enviado. Confira
            também a caixa de spam.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">E-mail</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
                placeholder="voce@exemplo.com"
              />
            </label>
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-zinc-900 py-3 font-semibold text-white disabled:opacity-60"
            >
              {loading ? "Enviando…" : "Enviar link"}
            </button>
          </form>
        )}

        <p className="mt-4 text-center text-sm text-zinc-500">
          <Link href="/login" className="font-medium text-zinc-900 underline">
            Voltar ao login
          </Link>
        </p>
      </div>
    </main>
  );
}
