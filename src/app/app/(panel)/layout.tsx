import Link from "next/link";
import { redirect } from "next/navigation";
import { getSubscriptionAccess } from "@/lib/billing";
import { getCurrentBusiness } from "@/lib/panel/current-business";
import { SupportChat } from "@/components/support-chat";
import { SignOutButton } from "./sign-out-button";

const NAV = [
  { href: "/app", label: "Agenda" },
  { href: "/app/services", label: "Servizi" },
  { href: "/app/professionals", label: "Team" },
  { href: "/app/hours", label: "Orari" },
  { href: "/app/report", label: "Report" },
  { href: "/app/settings", label: "Impostazioni" },
];

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getCurrentBusiness();
  if (!ctx) redirect("/app/onboarding");

  const access = await getSubscriptionAccess(
    ctx.business.id,
    ctx.business.created_at,
    ctx.business.comped
  );
  if (!access.allowed) redirect("/app/billing");

  return (
    <div className="min-h-dvh bg-zinc-100 text-zinc-900">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-3">
          <div>
            <h1 className="font-bold">{ctx.business.name}</h1>
            <Link
              href={`/${ctx.business.slug}`}
              className="text-xs text-zinc-500 underline"
              target="_blank"
            >
              /{ctx.business.slug}
              {!ctx.business.published && " · non pubblicata"}
            </Link>
          </div>
          <SignOutButton />
        </div>
        <nav className="mx-auto flex w-full max-w-3xl flex-wrap gap-1 px-4 pb-2">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      {!ctx.business.published && (
        <div className="bg-sky-50 text-sky-900">
          <p className="mx-auto w-full max-w-3xl px-4 py-2 text-sm">
            🔒 La tua pagina <strong>non è ancora pubblica</strong> — i clienti
            non possono prenotare. Quando hai finito di inserire servizi,
            team e orari,{" "}
            <Link href="/app/settings" className="font-medium underline">
              pubblicala dalle Impostazioni
            </Link>
            .
          </p>
        </div>
      )}
      {access.status === "trialing" && (
        <div className="bg-amber-50 text-amber-800">
          <p className="mx-auto w-full max-w-3xl px-4 py-2 text-sm">
            Prova gratuita: {access.trialDaysLeft} giorno/i rimanente/i.{" "}
            <Link href="/app/billing" className="font-medium underline">
              Abbonati ora
            </Link>
          </p>
        </div>
      )}
      {access.status === "past_due" && (
        <div className="bg-red-50 text-red-700">
          <p className="mx-auto w-full max-w-3xl px-4 py-2 text-sm">
            Fattura scaduta — l&apos;accesso verrà bloccato a breve.{" "}
            <Link href="/app/billing" className="font-medium underline">
              Paga ora
            </Link>
          </p>
        </div>
      )}
      <main className="mx-auto w-full max-w-3xl px-4 py-6">{children}</main>
      <SupportChat />
    </div>
  );
}
