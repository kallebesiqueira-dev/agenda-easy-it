import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-zinc-100 px-4 text-center text-zinc-900">
      <p className="text-6xl font-bold text-zinc-300">404</p>
      <h1 className="mt-2 text-xl font-bold">Pagina non trovata</h1>
      <p className="mt-1 max-w-sm text-sm text-zinc-500">
        L&apos;indirizzo potrebbe essere sbagliato oppure la pagina di
        prenotazione non è ancora stata pubblicata.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-xl bg-zinc-900 px-5 py-2.5 font-semibold text-white"
      >
        Vai alla home
      </Link>
    </main>
  );
}
