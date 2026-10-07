import type { Metadata } from "next";
import Link from "next/link";
import type { Lang } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Informativa sulla Privacy — Agenda Easy",
};

const COPY: Record<
  Lang,
  {
    title: string;
    updated: string;
    sections: { h: string; p: string }[];
    back: string;
  }
> = {
  it: {
    title: "Informativa sulla Privacy",
    updated: "Ultimo aggiornamento: 6 ottobre 2026",
    sections: [
      {
        h: "1. Dati che raccogliamo",
        p: "Dalle attività abbonate: e-mail, dati dell'attività (nome, indirizzo, contatti) e Codice Fiscale / Partita IVA del titolare per l'emissione degli addebiti dell'abbonamento. Dai clienti finali che prenotano: nome e telefono forniti alla prenotazione — usati solo per identificare l'appuntamento presso l'attività scelta.",
      },
      {
        h: "2. Uso dei dati",
        p: "Usiamo i dati esclusivamente per far funzionare la piattaforma: mostrare la pagina di prenotazione, organizzare l'agenda dell'attività, gestire l'abbonamento e comunicare questioni relative all'account. Non vendiamo dati a terzi.",
      },
      {
        h: "3. Condivisione",
        p: "Condividiamo i dati solo con i fornitori necessari al funzionamento: Supabase (database e autenticazione), Vercel (hosting) e Stripe (addebiti dell'abbonamento), oltre ai casi previsti dalla legge.",
      },
      {
        h: "4. I tuoi diritti (GDPR)",
        p: "Puoi richiedere accesso, rettifica o cancellazione dei tuoi dati in qualsiasi momento scrivendo a kallebesiqueira@gmail.com. I clienti finali possono anche rivolgersi direttamente all'attività presso cui hanno prenotato.",
      },
      {
        h: "5. Sicurezza e conservazione",
        p: "I dati sono conservati presso fornitori con crittografia in transito e a riposo, con accesso limitato da regole di permesso per attività (RLS). Conserviamo i dati finché l'account esiste o finché richiesto da obblighi di legge.",
      },
    ],
    back: "← Torna alla home",
  },
  en: {
    title: "Privacy Policy",
    updated: "Last updated: 6 October 2026",
    sections: [
      {
        h: "1. Data we collect",
        p: "From subscribing businesses: e-mail, business details (name, address, contacts) and the owner's tax identification for issuing subscription charges. From end clients who book: name and phone provided at booking — used only to identify the appointment with the chosen business.",
      },
      {
        h: "2. How we use data",
        p: "We use data exclusively to run the platform: display the booking page, organise the business's agenda, manage the subscription and communicate account matters. We do not sell data to third parties.",
      },
      {
        h: "3. Sharing",
        p: "We share data only with the providers needed to operate: Supabase (database and authentication), Vercel (hosting) and Stripe (subscription charges), plus cases required by law.",
      },
      {
        h: "4. Your rights (GDPR)",
        p: "You can request access, rectification or deletion of your data at any time by writing to kallebesiqueira@gmail.com. End clients may also contact the business they booked with directly.",
      },
      {
        h: "5. Security and retention",
        p: "Data is stored with providers using encryption in transit and at rest, with access restricted by per-business permission rules (RLS). We keep data for as long as the account exists or as required by legal obligations.",
      },
    ],
    back: "← Back to the homepage",
  },
};

export default async function PrivacyPage() {
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
      </div>

      <p className="mt-10 text-sm">
        <Link href="/" className="underline">
          {t.back}
        </Link>
      </p>
    </main>
  );
}
