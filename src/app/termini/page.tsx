import type { Metadata } from "next";
import Link from "next/link";
import type { Lang } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Termini di Utilizzo — Agenda Easy" };

const COPY: Record<
  Lang,
  {
    title: string;
    updated: string;
    sections: { h: string; p: string }[];
    contactPre: string;
    privacyLink: string;
    back: string;
  }
> = {
  it: {
    title: "Termini di Utilizzo",
    updated: "Ultimo aggiornamento: 6 ottobre 2026",
    sections: [
      {
        h: "1. Il servizio",
        p: "Agenda Easy è una piattaforma di prenotazione online per piccole attività. L'attività abbonata inserisce servizi, team e orari e riceve una pagina pubblica dove i suoi clienti prenotano appuntamenti, previo pagamento di un acconto pari al 50% del valore del servizio.",
      },
      {
        h: "2. Abbonamento e prova gratuita",
        p: "L'uso del pannello richiede un abbonamento (Piano Unico, 9,90 €/mese), con 7 giorni di prova gratuita dalla creazione dell'attività. Al termine della prova, l'accesso viene bloccato fino alla conferma del pagamento. La disdetta può essere effettuata in qualsiasi momento e interrompe gli addebiti successivi.",
      },
      {
        h: "3. Pagamenti tra attività e cliente finale",
        p: "L'acconto del 50% viene concordato e ricevuto direttamente tra l'attività e il suo cliente (es.: bonifico sul conto dell'attività stessa). Agenda Easy non intermedia, trattiene o garantisce tali importi, né risponde di eventuali rimborsi tra le parti.",
      },
      {
        h: "4. Responsabilità",
        p: "L'attività è responsabile delle informazioni pubblicate sulla propria pagina (servizi, prezzi, orari) e dell'erogazione degli appuntamenti. Agenda Easy fornisce la piattaforma «così com'è», impegnandosi ragionevolmente a mantenerla disponibile e sicura.",
      },
      {
        h: "5. Chiusura",
        p: "Gli account che violano questi termini o la legge possono essere sospesi. Puoi chiudere il tuo account in qualsiasi momento scrivendo all'e-mail di supporto.",
      },
    ],
    contactPre: "6. Contatti — Domande su questi termini: kallebesiqueira@gmail.com. Consulta anche la nostra",
    privacyLink: "Informativa sulla Privacy",
    back: "← Torna alla home",
  },
  en: {
    title: "Terms of Use",
    updated: "Last updated: 6 October 2026",
    sections: [
      {
        h: "1. The service",
        p: "Agenda Easy is an online booking platform for small businesses. The subscribing business adds services, team and hours and gets a public page where its clients book appointments, upon payment of a deposit equal to 50% of the service value.",
      },
      {
        h: "2. Subscription and free trial",
        p: "Using the dashboard requires a subscription (Single Plan, €9.90/month), with a 7-day free trial from the creation of the business. When the trial ends, access is blocked until payment is confirmed. You can cancel at any time, which stops future charges.",
      },
      {
        h: "3. Payments between business and end client",
        p: "The 50% deposit is arranged and received directly between the business and its client (e.g. a transfer to the business's own account). Agenda Easy does not intermediate, hold or guarantee these amounts, nor is it responsible for refunds between the parties.",
      },
      {
        h: "4. Responsibilities",
        p: "The business is responsible for the information published on its page (services, prices, hours) and for delivering the appointments. Agenda Easy provides the platform “as is”, making reasonable efforts to keep it available and secure.",
      },
      {
        h: "5. Termination",
        p: "Accounts that violate these terms or the law may be suspended. You can close your account at any time by writing to the support e-mail.",
      },
    ],
    contactPre: "6. Contact — Questions about these terms: kallebesiqueira@gmail.com. See also our",
    privacyLink: "Privacy Policy",
    back: "← Back to the homepage",
  },
};

export default async function TermsPage() {
  const lang = await getLang();
  const t = COPY[lang];

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-16 text-zinc-900">
      <h1 className="text-3xl font-bold">{t.title}</h1>
      <p className="mt-2 text-sm text-zinc-500">{t.updated}</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-zinc-700">
        {t.sections.map((s) => (
          <section key={s.h}>
            <h2 className="mb-1 font-semibold text-zinc-900">{s.h}</h2>
            <p>{s.p}</p>
          </section>
        ))}
        <section>
          <p>
            {t.contactPre}{" "}
            <Link href="/privacy" className="underline">
              {t.privacyLink}
            </Link>
            .
          </p>
        </section>
      </div>

      <p className="mt-10 text-sm">
        <Link href="/" className="underline">
          {t.back}
        </Link>
      </p>
    </main>
  );
}
