import type { ReactNode } from "react";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ManageCookies } from "@/components/cookie-consent";
import { COMPANY } from "@/lib/legal";
import type { Lang } from "@/lib/i18n";

const NAV = {
  it: { terms: "Termini", privacy: "Privacy", cookie: "Cookie", home: "Home" },
  en: { terms: "Terms", privacy: "Privacy", cookie: "Cookies", home: "Home" },
} as const;

export function LegalShell({
  lang,
  title,
  updated,
  children,
}: {
  lang: Lang;
  title: string;
  updated: string;
  children: ReactNode;
}) {
  const nav = NAV[lang];
  const notice =
    lang === "en"
      ? "Informational text. It is not legal advice and should be reviewed by a professional before you rely on it."
      : "Testo informativo. Non è un parere legale e va rivisto da un professionista prima di farvi affidamento.";

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-12 sm:py-16">
      <div className="mb-8 flex items-center justify-between gap-3">
        <Link href="/" className="wordmark text-[20px]">
          agenda<em>easy</em>.
        </Link>
        <LanguageSwitcher current={lang} />
      </div>
      <p className="rounded-[16px] border border-[var(--border)] bg-[var(--tint-wash)] px-4 py-3 text-[13px] leading-relaxed text-[var(--ink-soft)]">
        {notice}
      </p>
      <h1 className="mt-8 font-[family-name:var(--font-serif)] text-[40px] leading-none tracking-[-0.03em] sm:text-[52px]">
        {title}
      </h1>
      <p className="mt-3 text-[13px] text-[var(--label-2)]">{updated}</p>
      <dl className="mt-6 grid gap-1 text-[14px] text-[var(--ink-soft)]">
        <div>
          <dt className="inline font-semibold text-[var(--label)]">{lang === "en" ? "Operator" : "Titolare"}: </dt>
          <dd className="inline">{COMPANY.name}</dd>
        </div>
        <div>
          <dt className="inline font-semibold text-[var(--label)]">{lang === "en" ? "Address" : "Sede"}: </dt>
          <dd className="inline">{COMPANY.address}</dd>
        </div>
        <div>
          <dt className="inline font-semibold text-[var(--label)]">E-mail: </dt>
          <dd className="inline">
            <a href={`mailto:${COMPANY.email}`} className="underline">{COMPANY.email}</a>
          </dd>
        </div>
        <div>
          <dt className="inline font-semibold text-[var(--label)]">Sito: </dt>
          <dd className="inline">
            <a href={COMPANY.site} className="underline">{COMPANY.site.replace("https://", "")}</a>
          </dd>
        </div>
      </dl>
      <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-[var(--ink-soft)]">{children}</div>
      <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[var(--separator)] pt-6 text-[14px]">
        <Link href="/" className="font-semibold hover:text-[var(--tint)]">{nav.home}</Link>
        <Link href="/termini" className="hover:text-[var(--tint)]">{nav.terms}</Link>
        <Link href="/privacy" className="hover:text-[var(--tint)]">{nav.privacy}</Link>
        <Link href="/cookie" className="hover:text-[var(--tint)]">{nav.cookie}</Link>
        <ManageCookies label={lang === "en" ? "Cookie settings" : "Gestisci cookie"} />
      </div>
    </main>
  );
}
