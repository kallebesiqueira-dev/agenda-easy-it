import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell } from "@/components/legal/legal-shell";
import { COMPANY, LEGAL_UPDATED } from "@/lib/legal";
import { getLang } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return lang === "en"
    ? {
        title: "Privacy Policy — Agenda Easy",
        description: "How Agenda Easy handles personal data under the GDPR: roles, legal bases, rights and providers.",
      }
    : {
        title: "Informativa sulla privacy — Agenda Easy",
        description: "Informativa privacy di Agenda Easy ai sensi del GDPR: ruoli, basi giuridiche, diritti e fornitori.",
      };
}

export default async function PrivacyPage() {
  const lang = await getLang();
  const it = lang === "it";

  const sections = it
    ? [
        ["1. Titolare", `Agenda Easy è offerto da ${COMPANY.name}, con sede in ${COMPANY.address}. Il contatto per i dati degli account (imprese e professionisti che usano il servizio) è ${COMPANY.email}. Sito: ${COMPANY.site}.`],
        ["2. Due ruoli diversi", "Per i dati dell'account (e-mail, attività, fatturazione) siamo titolari. Per i dati delle persone che prenotano presso un'attività (nome, telefono, e-mail facoltativa, appuntamento) l'attività è titolare e Agenda Easy è responsabile del trattamento: li trattiamo solo per erogare il servizio a quell'attività. Il contratto di nomina a responsabile si richiede a " + COMPANY.email + "."],
        ["3. Quali dati", "Account: e-mail, password (in forma non leggibile), nome dell'attività, indirizzo, telefoni, logo e copertina, colore, servizi, team, orari, abbonamento Stripe. Prenotazioni: nome, telefono, e-mail se lasciata, servizio, orario, lingua. Tecnici: cookie di sessione e di lingua, log di sicurezza. Misurazione delle visite solo se acconsentita e se il servizio è configurato."],
        ["4. Perché, e su quale base", "Esecuzione del contratto: account, pagina pubblica, agenda, e-mail di conferma e promemoria (art. 6.1.b). Obbligo di legge: fatture e conservazione contabile (art. 6.1.c). Legittimo interesse: sicurezza e prevenzione abusi, bilanciato con i diritti dell'interessato (art. 6.1.f). Consenso: cookie di misurazione, revocabile in qualsiasi momento (art. 6.1.a)."],
        ["5. A chi li comunichiamo", "Fornitori necessari: Supabase (database e autenticazione), Vercel (hosting), Stripe (abbonamento dell'attività, non il pagamento della seduta), Resend (e-mail di servizio). Misurazione: Plausible, solo dopo il consenso e solo se configurato sull'installazione. Autorità, se la legge lo impone. Non vendiamo dati."],
        ["6. Fuori dallo Spazio economico europeo", "Alcuni fornitori possono trattare dati fuori dal SEE. In quel caso il trasferimento si appoggia alle clausole contrattuali tipo della Commissione europea o a una decisione di adeguatezza. Il dettaglio aggiornato dei fornitori si chiede a " + COMPANY.email + "."],
        ["7. Per quanto tempo", "Dati dell'account: per la durata del rapporto e poi per i tempi di legge (in genere fino a 10 anni per i documenti contabili). Prenotazioni: per il tempo in cui l'attività tiene l'account, salvo obblighi diversi. Log di sicurezza: per un periodo limitato. Il consenso ai cookie di misurazione dura 6 mesi, poi lo chiediamo di nuovo."],
        ["8. I tuoi diritti", "Puoi chiedere accesso, rettifica, cancellazione, limitazione, portabilità e opposizione, e revocare il consenso, scrivendo a " + COMPANY.email + ". I clienti di un'attività possono rivolgersi anche a quell'attività. Hai diritto di reclamo al Garante per la protezione dei dati personali (www.garanteprivacy.it)."],
        ["9. Minori", "Il servizio non è rivolto ai minori di 14 anni. Non raccogliamo consapevolmente i loro dati."],
      ]
    : [
        ["1. Controller", `Agenda Easy is offered by ${COMPANY.name}, based in ${COMPANY.address}. The contact for account data (businesses and professionals using the service) is ${COMPANY.email}. Site: ${COMPANY.site}.`],
        ["2. Two different roles", "For account data (e-mail, business, billing) we are the controller. For the people who book with a business (name, phone, optional e-mail, appointment) the business is the controller and Agenda Easy is the processor: we use that data only to provide the service to that business. The processing agreement can be requested at " + COMPANY.email + "."],
        ["3. Which data", "Account: e-mail, password (not stored in readable form), business name, address, phones, logo and cover, colour, services, team, hours, Stripe subscription. Bookings: name, phone, e-mail if given, service, time, language. Technical: session and language cookies, security logs. Visit measurement only if consented and if the service is configured."],
        ["4. Why, and on which basis", "Contract: account, public page, agenda, confirmation and reminder e-mails (art. 6.1.b). Legal duty: invoices and accounting retention (art. 6.1.c). Legitimate interest: security and abuse prevention, balanced against the person's rights (art. 6.1.f). Consent: measurement cookies, withdrawable at any time (art. 6.1.a)."],
        ["5. Who receives them", "Necessary providers: Supabase (database and authentication), Vercel (hosting), Stripe (the business's subscription, not the appointment payment), Resend (service e-mail). Measurement: Plausible, only after consent and only if configured on the installation. Authorities, when the law requires it. We do not sell data."],
        ["6. Outside the European Economic Area", "Some providers may process data outside the EEA. Where that happens, the transfer relies on the European Commission's standard contractual clauses or an adequacy decision. An up-to-date list of providers is available from " + COMPANY.email + "."],
        ["7. How long", "Account data: for the life of the relationship and then for the legal periods (generally up to 10 years for accounting records). Bookings: for as long as the business keeps the account, unless a different duty applies. Security logs: for a limited period. Consent for measurement cookies lasts 6 months, then we ask again."],
        ["8. Your rights", "You can ask for access, rectification, erasure, restriction, portability and objection, and withdraw consent, by writing to " + COMPANY.email + ". A business's clients can also contact that business. You may lodge a complaint with the Italian Data Protection Authority (www.garanteprivacy.it)."],
        ["9. Children", "The service is not directed at children under 14. We do not knowingly collect their data."],
      ];

  return (
    <LegalShell
      lang={lang}
      title={it ? "Informativa sulla privacy" : "Privacy Policy"}
      updated={it ? `Ultimo aggiornamento: ${LEGAL_UPDATED.it}` : `Last updated: ${LEGAL_UPDATED.en}`}
    >
      {sections.map(([h, p]) => (
        <section key={h}>
          <h2 className="mb-1 font-semibold text-[var(--label)]">{h}</h2>
          <p>{p}</p>
        </section>
      ))}
      <p>
        {it ? "Il dettaglio dei cookie è nell'" : "Cookie details are in the "}
        <Link href="/cookie" className="font-semibold text-[var(--tint)] underline underline-offset-2">
          {it ? "informativa cookie" : "cookie policy"}
        </Link>
        .
      </p>
    </LegalShell>
  );
}
