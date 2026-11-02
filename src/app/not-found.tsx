import Link from "next/link";
import { getLang } from "@/lib/i18n/server";

export default async function NotFound() {
  const lang = await getLang();
  const t =
    lang === "en"
      ? {
          title: "Page not found",
          sub: "The address may be wrong, or the booking page hasn't been published yet.",
          home: "Go to the homepage",
        }
      : {
          title: "Pagina non trovata",
          sub: "L'indirizzo potrebbe essere sbagliato oppure la pagina di prenotazione non è ancora stata pubblicata.",
          home: "Vai alla home",
        };

  return (
    <main className="flex ui-panel ui-grain relative min-h-dvh flex-col items-center justify-center bg-[var(--bg)] px-4 py-10 text-center text-zinc-900">
      <p className="font-[family-name:var(--font-display)] text-8xl font-semibold text-[var(--tint)]/80 italic">404</p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold">{t.title}</h1>
      <p className="mt-1 max-w-sm text-sm text-zinc-500">{t.sub}</p>
      <Link
        href="/"
        className="mt-6 rounded-full bg-tint px-5 py-2.5 font-semibold text-white ui-press hover:bg-emerald-700"
      >
        {t.home}
      </Link>
    </main>
  );
}
