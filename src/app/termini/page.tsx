import type { Metadata } from "next";
import { LegalShell } from "@/components/legal/legal-shell";
import { COMPANY, LEGAL_UPDATED } from "@/lib/legal";
import { getLang } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return lang === "en"
    ? {
        title: "Terms and Conditions — Agenda Easy",
        description: "Agenda Easy terms of service, subscription, free trial and liability.",
      }
    : {
        title: "Termini e Condizioni — Agenda Easy",
        description: "Condizioni del servizio Agenda Easy, abbonamento, prova gratuita e responsabilità.",
      };
}

export default async function TermsPage() {
  const lang = await getLang();
  const it = lang === "it";

  const sections = it
    ? [
        ["1. Chi siamo e cosa accetti", `Agenda Easy è un software di prenotazione online offerto da ${COMPANY.name}, con sede in ${COMPANY.address} (${COMPANY.site}). Creando un account accetti questi termini e l'informativa privacy. Se non li accetti, non usare il servizio.`],
        ["2. Il servizio", "L'attività abbonata inserisce servizi, prodotti, piani, team e orari e riceve una pagina pubblica. I suoi clienti prenotano da soli. Il pagamento della seduta avviene sul posto, tra attività e cliente: Agenda Easy non incassa quegli importi e non li garantisce."],
        ["3. Account", "L'account è personale. Sei responsabile delle credenziali e dei dati che pubblichi (prezzi, orari, foto, testi). Devi avere il diritto di trattare i dati dei tuoi clienti e di informarli."],
        ["4. Abbonamento, prova e recesso", "Il pannello richiede il Piano Unico (9,90 €/mese), con 7 giorni di prova dalla creazione dell'attività. Senza pagamento al termine della prova l'accesso si blocca. Puoi disdire quando vuoi: gli addebiti successivi si interrompono. Il servizio è rivolto a imprese e professionisti. Se chi acquista è un consumatore ai sensi del Codice del consumo, il recesso di 14 giorni si applica nei limiti di legge e non copre il periodo già usato se hai chiesto di iniziare subito."],
        ["5. Uso lecito", "Non è consentito usare la piattaforma per contenuti illeciti, per aggirare i limiti tecnici o per caricare dati di cui non puoi disporre. Gli account in violazione possono essere sospesi."],
        ["6. Disponibilità", `La piattaforma è fornita «così com'è». Ci impegniamo a mantenerla disponibile e sicura, senza garantire l'assenza di interruzioni. La responsabilità complessiva di ${COMPANY.name}, salvo dolo o colpa grave e i casi inderogabili di legge, è limitata ai canoni pagati nei 12 mesi precedenti il fatto.`],
        ["7. Legge applicabile", "Si applica la legge italiana. Restano salvi i fori inderogabili previsti per il consumatore."],
        ["8. Contatti", `Domande su questi termini: ${COMPANY.email}.`],
      ]
    : [
        ["1. Who we are and what you accept", `Agenda Easy is online booking software offered by ${COMPANY.name}, based in ${COMPANY.address} (${COMPANY.site}). Creating an account means you accept these terms and the privacy notice. If you do not, do not use the service.`],
        ["2. The service", "The subscribing business adds services, products, plans, team and hours and gets a public page. Its clients book on their own. The appointment is paid on site, between the business and the client: Agenda Easy does not collect those amounts and does not guarantee them."],
        ["3. Account", "The account is personal. You are responsible for your credentials and for what you publish (prices, hours, photos, text). You must be entitled to process your clients' data and to inform them."],
        ["4. Subscription, trial and withdrawal", "The dashboard requires the Single Plan (€9.90/month), with a 7-day trial from the creation of the business. Without payment at the end of the trial, access is blocked. You can cancel at any time: future charges stop. The service is aimed at businesses and professionals. If the buyer is a consumer under the Italian Consumer Code, the 14-day withdrawal right applies within the limits of the law and does not cover the period already used if you asked to start immediately."],
        ["5. Lawful use", "You may not use the platform for unlawful content, to bypass technical limits, or to upload data you are not allowed to use. Accounts in breach may be suspended."],
        ["6. Availability", `The platform is provided “as is”. We work to keep it available and secure, without promising uninterrupted service. The overall liability of ${COMPANY.name}, except for wilful misconduct or gross negligence and non-waivable law, is limited to the fees paid in the 12 months before the event.`],
        ["7. Governing law", "Italian law applies. Non-waivable consumer venues stay in place."],
        ["8. Contact", `Questions about these terms: ${COMPANY.email}.`],
      ];

  return (
    <LegalShell
      lang={lang}
      title={it ? "Termini e Condizioni" : "Terms and Conditions"}
      updated={it ? `Ultimo aggiornamento: ${LEGAL_UPDATED.it}` : `Last updated: ${LEGAL_UPDATED.en}`}
    >
      {sections.map(([h, p]) => (
        <section key={h}>
          <h2 className="mb-1 font-semibold text-[var(--label)]">{h}</h2>
          <p>{p}</p>
        </section>
      ))}
    </LegalShell>
  );
}
