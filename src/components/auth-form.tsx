"use client";

/**
 * Form unico di accesso/registrazione. Auth fatta nel browser (@supabase/ssr
 * scrive i cookie); navigazione con reload completo così il server
 * renderizza già autenticato.
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { signInSchema } from "@/lib/validation";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signInWithGoogle() {
    setError(null);
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/app`,
      },
    });
    if (error) {
      setError("Impossibile accedere con Google. Riprova.");
      setLoading(false);
    }
    // successo: il browser naviga verso Google — nient'altro da fare qui
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dati non validi.");
      return;
    }

    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword(parsed.data);
        if (error) {
          setError("E-mail o password errati.");
          return;
        }
        const next = new URLSearchParams(window.location.search).get("next");
        router.push(next?.startsWith("/") ? next : "/app");
        router.refresh(); // ri-renderizza il server con la nuova sessione
      } else {
        const { data, error } = await supabase.auth.signUp(parsed.data);
        if (error) {
          setError(
            error.message.includes("already registered")
              ? "Questa e-mail ha già un account. Accedi."
              : "Impossibile creare l'account. Riprova."
          );
          return;
        }
        if (!data.session) {
          // Progetto con conferma e-mail attiva
          setInfo("Ti abbiamo inviato un link di conferma via e-mail.");
          return;
        }
        router.push("/app");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={signInWithGoogle}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 py-3 font-medium transition-colors hover:bg-zinc-50 disabled:opacity-60"
      >
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
        Continua con Google
      </button>

      <div className="my-4 flex items-center gap-3 text-xs text-zinc-400">
        <span className="h-px flex-1 bg-zinc-200" />
        oppure con e-mail
        <span className="h-px flex-1 bg-zinc-200" />
      </div>

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
          placeholder="tu@esempio.com"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Password</span>
        <div className="flex items-center rounded-lg border border-zinc-300 focus-within:border-zinc-900">
          <input
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg px-3 py-2 outline-none"
            placeholder="Minimo 8 caratteri"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Nascondi password" : "Mostra password"}
            className="px-3 text-zinc-400 hover:text-zinc-700"
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>
      </label>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      {info && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {info}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-zinc-900 py-3 font-semibold text-white disabled:opacity-60"
      >
        {loading ? "Attendi…" : mode === "login" ? "Accedi" : "Crea account"}
      </button>

      {mode === "login" && (
        <p className="text-center text-sm">
          <Link href="/password-dimenticata" className="text-zinc-500 underline">
            Ho dimenticato la password
          </Link>
        </p>
      )}
    </form>
    </div>
  );
}
