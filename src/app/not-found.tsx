import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-zinc-100 px-4 text-center text-zinc-900">
      <p className="text-6xl font-bold text-zinc-300">404</p>
      <h1 className="mt-2 text-xl font-bold">Página não encontrada</h1>
      <p className="mt-1 max-w-sm text-sm text-zinc-500">
        O endereço pode estar errado ou a página de agendamento ainda não foi
        publicada.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-xl bg-zinc-900 px-5 py-2.5 font-semibold text-white"
      >
        Ir para o início
      </Link>
    </main>
  );
}
