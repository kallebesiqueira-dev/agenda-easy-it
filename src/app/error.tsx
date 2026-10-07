"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-zinc-100 px-4 text-center text-zinc-900">
      <h1 className="text-xl font-bold">Algo deu errado</h1>
      <p className="mt-1 max-w-sm text-sm text-zinc-500">
        Tente novamente em instantes. Se persistir, fale com o suporte.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-xl bg-zinc-900 px-5 py-2.5 font-semibold text-white"
      >
        Tentar de novo
      </button>
    </main>
  );
}
