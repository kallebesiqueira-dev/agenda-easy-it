import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Informativa sulla Privacy — Agenda Easy",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-16 text-zinc-900">
      <h1 className="text-3xl font-bold">Informativa sulla Privacy</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Ultimo aggiornamento: 6 ottobre 2026
      </p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-zinc-700">
        <section>
          <h2 className="mb-1 font-semibold text-zinc-900">1. Dati che raccogliamo</h2>
          <p>
            Dalle attività abbonate: e-mail, dati dell&apos;attività (nome,
            indirizzo, contatti) e Codice Fiscale / Partita IVA del titolare
            per l&apos;emissione degli addebiti dell&apos;abbonamento. Dai
            clienti finali che prenotano: nome e telefono forniti alla
            prenotazione — usati solo per identificare l&apos;appuntamento
            presso l&apos;attività scelta.
          </p>
        </section>
        <section>
          <h2 className="mb-1 font-semibold text-zinc-900">2. Uso dei dati</h2>
          <p>
            Usiamo i dati esclusivamente per far funzionare la piattaforma:
            mostrare la pagina di prenotazione, organizzare l&apos;agenda
            dell&apos;attività, gestire l&apos;abbonamento e comunicare
            questioni relative all&apos;account. Non vendiamo dati a terzi.
          </p>
        </section>
        <section>
          <h2 className="mb-1 font-semibold text-zinc-900">3. Condivisione</h2>
          <p>
            Condividiamo i dati solo con i fornitori necessari al
            funzionamento: Supabase (database e autenticazione), Vercel
            (hosting) e il gateway di pagamento (addebiti dell&apos;abbonamento),
            oltre ai casi previsti dalla legge.
          </p>
        </section>
        <section>
          <h2 className="mb-1 font-semibold text-zinc-900">4. I tuoi diritti (GDPR)</h2>
          <p>
            Puoi richiedere accesso, rettifica o cancellazione dei tuoi dati in
            qualsiasi momento scrivendo a kallebesiqueira@gmail.com. I clienti
            finali possono anche rivolgersi direttamente all&apos;attività
            presso cui hanno prenotato.
          </p>
        </section>
        <section>
          <h2 className="mb-1 font-semibold text-zinc-900">5. Sicurezza e conservazione</h2>
          <p>
            I dati sono conservati presso fornitori con crittografia in
            transito e a riposo, con accesso limitato da regole di permesso per
            attività (RLS). Conserviamo i dati finché l&apos;account esiste o
            finché richiesto da obblighi di legge.
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
