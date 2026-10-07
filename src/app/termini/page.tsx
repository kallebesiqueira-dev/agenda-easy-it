import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Termini di Utilizzo — Agenda Easy" };

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-16 text-zinc-900">
      <h1 className="text-3xl font-bold">Termini di Utilizzo</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Ultimo aggiornamento: 6 ottobre 2026
      </p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-zinc-700">
        <section>
          <h2 className="mb-1 font-semibold text-zinc-900">1. Il servizio</h2>
          <p>
            Agenda Easy è una piattaforma di prenotazione online per piccole
            attività. L&apos;attività abbonata inserisce servizi, team e orari
            e riceve una pagina pubblica dove i suoi clienti prenotano
            appuntamenti, previo pagamento di un acconto pari al 50% del valore
            del servizio.
          </p>
        </section>
        <section>
          <h2 className="mb-1 font-semibold text-zinc-900">2. Abbonamento e prova gratuita</h2>
          <p>
            L&apos;uso del pannello richiede un abbonamento (Piano Unico,
            9,90 €/mese), con 7 giorni di prova gratuita dalla creazione
            dell&apos;attività. Al termine della prova, l&apos;accesso viene
            bloccato fino alla conferma del pagamento. La disdetta può essere
            effettuata in qualsiasi momento e interrompe gli addebiti
            successivi.
          </p>
        </section>
        <section>
          <h2 className="mb-1 font-semibold text-zinc-900">3. Pagamenti tra attività e cliente finale</h2>
          <p>
            L&apos;acconto del 50% viene concordato e ricevuto direttamente tra
            l&apos;attività e il suo cliente (es.: bonifico sul conto
            dell&apos;attività stessa). Agenda Easy non intermedia, trattiene o
            garantisce tali importi, né risponde di eventuali rimborsi tra le
            parti.
          </p>
        </section>
        <section>
          <h2 className="mb-1 font-semibold text-zinc-900">4. Responsabilità</h2>
          <p>
            L&apos;attività è responsabile delle informazioni pubblicate sulla
            propria pagina (servizi, prezzi, orari) e dell&apos;erogazione
            degli appuntamenti. Agenda Easy fornisce la piattaforma «così
            com&apos;è», impegnandosi ragionevolmente a mantenerla disponibile
            e sicura.
          </p>
        </section>
        <section>
          <h2 className="mb-1 font-semibold text-zinc-900">5. Chiusura</h2>
          <p>
            Gli account che violano questi termini o la legge possono essere
            sospesi. Puoi chiudere il tuo account in qualsiasi momento
            scrivendo all&apos;e-mail di supporto.
          </p>
        </section>
        <section>
          <h2 className="mb-1 font-semibold text-zinc-900">6. Contatti</h2>
          <p>
            Domande su questi termini: kallebesiqueira@gmail.com. Consulta
            anche la nostra{" "}
            <Link href="/privacy" className="underline">
              Informativa sulla Privacy
            </Link>
            .
          </p>
        </section>
      </div>

      <p className="mt-10 text-sm">
        <Link href="/" className="underline">
          ← Torna alla home
        </Link>
      </p>
    </main>
  );
}
