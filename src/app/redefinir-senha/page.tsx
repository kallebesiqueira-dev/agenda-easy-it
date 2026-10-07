"use client";

/**
 * Destino do link de recuperação: o usuário chega já com sessão (o
 * /auth/callback trocou o code) e define a nova senha.
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(
        "Não foi possível salvar. O link pode ter expirado — peça um novo."
      );
      return;
    }
    router.push("/app");
    router.refresh();
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-zinc-100 px-4 text-zinc-900">
      <Link href="/" className="mb-4 text-xl font-bold tracking-tight">
        agenda<span className="italic text-emerald-900">easy</span>
        <span className="text-orange-600">.</span>
      </Link>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold">Nova senha</h1>
        <p className="mb-4 mt-1 text-sm text-zinc-500">
          Escolha a nova senha da sua conta.
        </p>
        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Nova senha</span>
            <div className="flex items-center rounded-lg border border-zinc-300 focus-within:border-zinc-900">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg px-3 py-2 outline-none"
                placeholder="Mínimo de 8 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                className="px-3 text-zinc-400 hover:text-zinc-700"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
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
            {loading ? "Salvando…" : "Salvar nova senha"}
          </button>
        </form>
      </div>
    </main>
  );
}
