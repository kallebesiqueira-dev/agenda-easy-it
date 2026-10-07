"use client";

/**
 * Chat di supporto flottante (angolo in basso a destra).
 * Risponde alle domande semplici con tono umano; le domande fuori copione
 * indirizzano al WhatsApp del supporto.
 */

import { useEffect, useRef, useState } from "react";

const WHATSAPP_URL =
  "https://wa.me/5575999689825?text=" +
  encodeURIComponent("Ciao! Ho bisogno di aiuto con Agenda Easy.");

interface Msg {
  from: "bot" | "user";
  text: string;
  whatsapp?: boolean;
}

const GREETING: Msg = {
  from: "bot",
  text: "Ciao! 👋 Sono Gio, del supporto di Agenda Easy. Posso aiutarti con prezzo, prova gratuita, prenotazioni, pagamenti... di cosa hai bisogno?",
};

const QUICK = ["Quanto costa?", "Come funziona la prova gratuita?", "Come ricevo l'acconto?", "Parlare con una persona"];

/** Rimuove gli accenti e porta in minuscolo per il matching. */
const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const FAQ: { match: RegExp; reply: string; whatsapp?: boolean }[] = [
  {
    match: /(prezzo|quanto costa|costo|mensile|piano|caro|tariffa)/,
    reply:
      "Il piano è unico: 49,90 €/mese tutto incluso — pagina di prenotazione, agenda, team e report, senza limiti. E inizi con 7 giorni gratis, senza carta. 😉",
  },
  {
    match: /(prova|gratis|trial|provare|gratuita)/,
    reply:
      "Creando il tuo account hai 7 giorni gratis con accesso completo — senza chiedere la carta. Ti abboni solo se ti piace. Lo crei in 2 minuti su agendaeasy.it/signup",
  },
  {
    match: /(creare account|registr|iniziare|come funziona|cominciare)/,
    reply:
      "È rapidissimo: 1) crea l'account, 2) inserisci servizi, team e orari, 3) pubblica dalle Impostazioni e condividi il tuo link. I tuoi clienti prenotano da soli e versano l'acconto con bonifico istantaneo. 🚀",
  },
  {
    match: /(acconto|bonifico|ricev|pagamento|addebito|deposito|caparra)/,
    reply:
      "Il cliente versa un acconto del 50% direttamente sulle TUE coordinate (inserite nelle Impostazioni) per confermare l'appuntamento. Il resto lo paga sul posto, in contanti o con carta. Non passa nulla da noi — i soldi arrivano direttamente a te. 💰",
  },
  {
    match: /(link|pagina|condivid|pubblicare|instagram|non e pubblic|non è pubblic|404)/,
    reply:
      'Il tuo link ha il formato agendaeasy.it/tua-attivita. Importante: va online solo dopo che spunti "Pagina pubblicata" nelle Impostazioni e salvi. Poi basta incollarlo nella bio di Instagram! 📲',
  },
  {
    match: /(disdire abbonamento|annullare abbonamento|disdetta|smettere di pagare)/,
    reply:
      "Puoi disdire quando vuoi, senza penali. Scrivimi su WhatsApp e risolviamo subito, ok?",
    whatsapp: true,
  },
  {
    match: /(annullare|cancellare|disdire|spostare|riprogrammare)/,
    reply:
      "Il cliente può annullare da solo con il link che riceve nella conferma (fino a 2h prima dell'orario). Anche tu puoi annullare qualsiasi prenotazione dal pannello, in Agenda. L'orario torna libero automaticamente.",
  },
  {
    match: /(orario|turno|disponib|compare.*ora|senza orari)/,
    reply:
      "Gli orari che il cliente vede sono l'incrocio tra gli orari di apertura dell'attività (scheda Orari) e i turni di ogni professionista (scheda Team → Turni). Se non compare nessun orario, controlla che il professionista abbia dei turni inseriti. 😉",
  },
  {
    match: /(foto|immagine|logo|profilo)/,
    reply:
      "Puoi personalizzare tutto: logo nelle Impostazioni, foto di ogni servizio in Servizi → Modifica, e foto del professionista cliccando sul suo avatar in Team.",
  },
  {
    match: /(google|accedere con)/,
    reply:
      'Sì! Puoi accedere con l\'account Google — basta cliccare su "Continua con Google" nella schermata di accesso. Niente password da ricordare. ✌️',
  },
  {
    match: /(password|dimenticat|non riesco ad accedere|non riesco a entrare)/,
    reply:
      'Nessun problema: nella schermata di accesso, clicca su "Ho dimenticato la password" e ti inviamo un link via e-mail per crearne una nuova.',
  },
  {
    match: /(promemoria|email|e-mail|notific)/,
    reply:
      "Quando il cliente lascia l'e-mail alla prenotazione, riceve subito la conferma e un promemoria il giorno prima — tutto automatico. Meno buchi in agenda! ⏰",
  },
  {
    match: /(persona|umano|operatore|whats|parlare con|supporto|aiuto)/,
    reply: "Certo! Scrivimi su WhatsApp e ti seguo personalmente: 👇",
    whatsapp: true,
  },
];

function answer(text: string): Msg {
  const n = norm(text);
  for (const f of FAQ) {
    if (f.match.test(n)) {
      return { from: "bot", text: f.reply, whatsapp: f.whatsapp };
    }
  }
  return {
    from: "bot",
    text: "Bella domanda! Meglio chiarirla con il nostro team per non darti informazioni sbagliate. Scrivimi su WhatsApp: 👇",
    whatsapp: true,
  };
}

export function SupportChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing, open]);

  function send(text: string) {
    const clean = text.trim();
    if (!clean || typing) return;
    setMessages((m) => [...m, { from: "user", text: clean }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setMessages((m) => [...m, answer(clean)]);
      setTyping(false);
    }, 900);
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open && (
        <div className="flex max-h-[70vh] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10">
          <div className="flex items-center gap-3 bg-[#17493b] px-4 py-3 text-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/suporte-avatar.png"
              alt=""
              className="size-10 rounded-full bg-white/10 object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-tight">Gio · Supporto</p>
              <p className="flex items-center gap-1.5 text-xs text-white/70">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                online adesso
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Chiudi chat"
              className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-zinc-50 p-4 text-sm">
            {messages.map((m, i) => (
              <div key={i}>
                <div
                  className={
                    m.from === "bot"
                      ? "max-w-[85%] rounded-2xl rounded-tl-sm bg-white px-3.5 py-2.5 text-zinc-800 shadow-sm"
                      : "ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-[#17493b] px-3.5 py-2.5 text-white"
                  }
                >
                  {m.text}
                </div>
                {m.whatsapp && (
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block rounded-xl bg-[#25D366] px-4 py-2 font-semibold text-white"
                  >
                    Scrivici su WhatsApp
                  </a>
                )}
              </div>
            ))}
            {typing && (
              <div className="w-20 rounded-2xl rounded-tl-sm bg-white px-3.5 py-2.5 text-zinc-400 shadow-sm">
                <span className="animate-pulse">sta scrivendo…</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Domande rapide fisse — sempre visibili, non scompaiono */}
          <div className="flex flex-wrap gap-1.5 border-t border-zinc-100 bg-white px-3 pt-2.5">
            {QUICK.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => send(q)}
                className="rounded-full border border-[#17493b]/30 bg-white px-3 py-1.5 text-xs font-medium text-[#17493b] hover:bg-[#17493b]/5"
              >
                {q}
              </button>
            ))}
          </div>

          <form
            className="flex items-center gap-2 bg-white p-3"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Scrivi la tua domanda…"
              className="flex-1 rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-[#17493b]"
            />
            <button
              type="submit"
              aria-label="Invia"
              className="rounded-xl bg-[#17493b] px-3.5 py-2 font-semibold text-white"
            >
              ➤
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Chiudi supporto" : "Apri supporto"}
        className="group relative flex flex-col items-center transition-transform hover:scale-105"
      >
        {/* fumetto "Supporto" sopra la testa */}
        <span className="relative mb-1 rounded-xl bg-white px-3 py-1 text-xs font-semibold text-[#17493b] shadow-md">
          Supporto
          <span className="absolute -bottom-1 left-1/2 size-2 -translate-x-1/2 rotate-45 bg-white" />
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/suporte-avatar.png"
          alt="Supporto"
          className="w-20 object-contain"
        />
      </button>
    </div>
  );
}
