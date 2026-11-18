import type { Metadata } from "next";
import { LegalShell } from "@/components/legal/legal-shell";
import { COMPANY, LEGAL_UPDATED } from "@/lib/legal";
import { getLang } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Informativa cookie — Agenda Easy",
  description:
    "Cookie tecnici e, solo dopo il consenso, misurazione delle visite. Come accettare, rifiutare o cambiare scelta.",
};

export default async function CookiePage() {
  const lang = await getLang();
  const it = lang === "it";

  const rows = it
    ? [
        ["lang", "Tecnico", "Ricorda italiano o inglese", "1 anno"],
        ["ae-consent", "Tecnico", "Ricorda la scelta sui cookie", "6 mesi"],
        ["Sessione Supabase", "Tecnico", "Tiene l'accesso al pannello", "Sessione / rinnovo"],
        ["Plausible", "Misurazione", "Visite aggregate, solo col consenso e se configurato", "Nessun cookie di profilazione"],
      ]
    : [
        ["lang", "Essential", "Remembers Italian or English", "1 year"],
        ["ae-consent", "Essential", "Remembers the cookie choice", "6 months"],
        ["Supabase session", "Essential", "Keeps you signed in to the dashboard", "Session / refresh"],
        ["Plausible", "Measurement", "Aggregate visits, only with consent and if configured", "No profiling cookie"],
      ];

  return (
    <LegalShell
      lang={lang}
      title={it ? "Informativa sui cookie" : "Cookie Policy"}
      updated={it ? `Ultimo aggiornamento: ${LEGAL_UPDATED.it}` : `Last updated: ${LEGAL_UPDATED.en}`}
    >
      <section>
        <h2 className="mb-1 font-semibold text-[var(--label)]">{it ? "1. Cosa sono" : "1. What they are"}</h2>
        <p>
          {it
            ? `I cookie sono piccoli file salvati sul dispositivo. ${COMPANY.name} usa cookie tecnici per far funzionare il sito e, solo con il tuo consenso, una misurazione aggregata delle visite.`
            : `${COMPANY.name} uses essential cookies to run the site and, only with your consent, an aggregate measurement of visits.`}
        </p>
      </section>
      <section>
        <h2 className="mb-2 font-semibold text-[var(--label)]">{it ? "2. Elenco" : "2. List"}</h2>
        <div className="overflow-x-auto rounded-[16px] border border-[var(--border)]">
          <table className="w-full min-w-[520px] text-left text-[13px]">
            <thead className="bg-[var(--fill-2)] text-[var(--label)]">
              <tr>
                {(it ? ["Nome", "Tipo", "Scopo", "Durata"] : ["Name", "Type", "Purpose", "Duration"]).map((head) => (
                  <th key={head} className="px-3 py-2 font-semibold">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row[0]} className="border-t border-[var(--separator)]">
                  {row.map((cell) => (
                    <td key={cell} className="px-3 py-2 align-top">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section>
        <h2 className="mb-1 font-semibold text-[var(--label)]">{it ? "3. Misurazione" : "3. Measurement"}</h2>
        <p>
          {it
            ? "Lo script di Plausible (plausible.io) viene caricato soltanto se accetti la categoria «Misurazione» e se chi gestisce questo sito ha impostato il dominio di analisi. Se quella variabile non c'è, nessun servizio di analisi viene contattato. Puoi rifiutare senza perdere l'uso del sito."
            : "The Plausible script (plausible.io) loads only if you accept the “Measurement” category and the site operator has set the analytics domain. If that variable is empty, no analytics service is contacted. You can reject it and still use the site."}
        </p>
      </section>
      <section>
        <h2 className="mb-1 font-semibold text-[var(--label)]">{it ? "4. Video" : "4. Video"}</h2>
        <p>
          {it
            ? "Il video in home resta un'immagine finché non premi play. Solo allora si apre YouTube in modalità privacy rafforzata (youtube-nocookie.com). Non lo carichiamo da soli."
            : "The homepage video stays an image until you press play. Only then YouTube opens in privacy-enhanced mode (youtube-nocookie.com). We do not load it on our own."}
        </p>
      </section>
      <section>
        <h2 className="mb-1 font-semibold text-[var(--label)]">{it ? "5. Come cambiare idea" : "5. How to change your mind"}</h2>
        <p>
          {it
            ? `Dal link «Gestisci cookie» in questa pagina o nel footer riapri la scelta: accetta, rifiuta o personalizza. La preferenza dura 6 mesi. Per scrivere a noi: ${COMPANY.email}.`
            : `The “Cookie settings” link on this page or in the footer reopens the choice: accept, reject or customise. The preference lasts 6 months. To write to us: ${COMPANY.email}.`}
        </p>
      </section>
    </LegalShell>
  );
}
