"use client";

/**
 * Chat di supporto flottante (angolo in basso a destra).
 * Risponde alle domande semplici con tono umano; le domande fuori copione
 * indirizzano al WhatsApp del supporto.
 */

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { Lang } from "@/lib/i18n";
import { useLang } from "@/lib/i18n/use-lang";

interface Msg {
  from: "bot" | "user";
  text: string;
  whatsapp?: boolean;
}

/** Rimuove gli accenti e porta in minuscolo per il matching. */
const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const FAQ_IT: { match: RegExp; reply: string; whatsapp?: boolean }[] = [
  {
    match: /(prezzo|quanto costa|costo|mensile|piano|caro|tariffa)/,
    reply:
      "Il piano è unico: 9,90 €/mese tutto incluso — pagina di prenotazione, agenda, team e report, senza limiti. E inizi con 7 giorni gratis, senza carta. 😉",
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

const FAQ_EN: { match: RegExp; reply: string; whatsapp?: boolean }[] = [
  {
    match: /(price|how much|cost|monthly|plan|expensive|fee)/,
    reply:
      "There's a single plan: €9.90/month with everything included — booking page, agenda, team and reports, no limits. And you start with 7 days free, no card required. 😉",
  },
  {
    match: /(trial|free|try)/,
    reply:
      "When you create your account you get 7 days free with full access — no card required. You only subscribe if you like it. Create it in 2 minutes at agendaeasy.it/signup",
  },
  {
    match: /(create account|sign ?up|register|get started|how does it work|start)/,
    reply:
      "It's quick: 1) create your account, 2) add services, team and hours, 3) publish from Settings and share your link. Your clients book on their own and pay the deposit by instant bank transfer. 🚀",
  },
  {
    match: /(deposit|transfer|receive|payment|charge|down ?payment)/,
    reply:
      "The client pays a 50% deposit straight to YOUR payment details (set in Settings) to confirm the appointment. The rest is paid on site, in cash or by card. Nothing goes through us — the money goes directly to you. 💰",
  },
  {
    match: /(link|page|share|publish|instagram|not public|404)/,
    reply:
      'Your link looks like agendaeasy.it/your-business. Important: it only goes live after you tick "Page published" in Settings and save. Then just paste it in your Instagram bio! 📲',
  },
  {
    match: /(cancel subscription|unsubscribe|stop paying)/,
    reply:
      "You can cancel anytime, no penalties. Message me on WhatsApp and we'll sort it out right away, ok?",
    whatsapp: true,
  },
  {
    match: /(cancel|reschedule|move)/,
    reply:
      "Clients can cancel on their own via the link they receive in the confirmation (up to 2h before the appointment). You can also cancel any booking from the dashboard, in Agenda. The slot becomes free again automatically.",
  },
  {
    match: /(hours|shift|availab|no slots|no times)/,
    reply:
      "The times clients see are the intersection of your opening hours (Hours tab) and each professional's shifts (Team → Shifts). If no times show up, check that the professional has shifts set. 😉",
  },
  {
    match: /(photo|image|logo|profile)/,
    reply:
      "You can customise everything: logo in Settings, each service's photo in Services → Edit, and the professional's photo by clicking their avatar in Team.",
  },
  {
    match: /(google|sign in with)/,
    reply:
      'Yes! You can sign in with your Google account — just click "Continue with Google" on the sign-in screen. No password to remember. ✌️',
  },
  {
    match: /(password|forgot|can'?t (sign|log) ?in)/,
    reply:
      'No stress: on the sign-in screen, click "I forgot my password" and we\'ll e-mail you a link to create a new one.',
  },
  {
    match: /(reminder|email|e-mail|notification)/,
    reply:
      "When the client leaves their e-mail at booking, they get an instant confirmation and a reminder the day before — all automatic. Fewer gaps in your agenda! ⏰",
  },
  {
    match: /(human|person|agent|whats|talk to|support|help)/,
    reply: "Of course! Message me on WhatsApp and I'll help you personally: 👇",
    whatsapp: true,
  },
];

const UI: Record<
  Lang,
  {
    waText: string;
    greeting: string;
    quick: string[];
    fallback: string;
    headerName: string;
    online: string;
    closeChat: string;
    waCta: string;
    typing: string;
    inputPh: string;
    send: string;
    openSupport: string;
    closeSupport: string;
    bubble: string;
    faq: { match: RegExp; reply: string; whatsapp?: boolean }[];
  }
> = {
  it: {
    waText: "Ciao! Ho bisogno di aiuto con Agenda Easy.",
    greeting:
      "Ciao! 👋 Sono Gio, del supporto di Agenda Easy. Posso aiutarti con prezzo, prova gratuita, prenotazioni, pagamenti... di cosa hai bisogno?",
    quick: [
      "Quanto costa?",
      "Come funziona la prova gratuita?",
      "Come ricevo l'acconto?",
      "Parlare con una persona",
    ],
    fallback:
      "Bella domanda! Meglio chiarirla con il nostro team per non darti informazioni sbagliate. Scrivimi su WhatsApp: 👇",
    headerName: "Gio · Supporto",
    online: "online adesso",
    closeChat: "Chiudi chat",
    waCta: "Scrivici su WhatsApp",
    typing: "sta scrivendo…",
    inputPh: "Scrivi la tua domanda…",
    send: "Invia",
    openSupport: "Apri supporto",
    closeSupport: "Chiudi supporto",
    bubble: "Supporto",
    faq: FAQ_IT,
  },
  en: {
    waText: "Hi! I need help with Agenda Easy.",
    greeting:
      "Hi! 👋 I'm Gio from Agenda Easy support. I can help with pricing, the free trial, bookings, payments... what do you need?",
    quick: [
      "How much does it cost?",
      "How does the free trial work?",
      "How do I receive the deposit?",
      "Talk to a person",
    ],
    fallback:
      "Good question! Best to sort that one out with our team so I don't give you wrong info. Message me on WhatsApp: 👇",
    headerName: "Gio · Support",
    online: "online now",
    closeChat: "Close chat",
    waCta: "Message us on WhatsApp",
    typing: "typing…",
    inputPh: "Type your question…",
    send: "Send",
    openSupport: "Open support",
    closeSupport: "Close support",
    bubble: "Support",
    faq: FAQ_EN,
  },
};

function answer(text: string, t: (typeof UI)[Lang]): Msg {
  const n = norm(text);
  for (const f of t.faq) {
    if (f.match.test(n)) {
      return { from: "bot", text: f.reply, whatsapp: f.whatsapp };
    }
  }
  return { from: "bot", text: t.fallback, whatsapp: true };
}

export function SupportChat() {
  const lang = useLang();
  const t = UI[lang];
  const whatsappUrl =
    "https://wa.me/5575999689825?text=" + encodeURIComponent(t.waText);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
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
      setMessages((m) => [...m, answer(clean, t)]);
      setTyping(false);
    }, 900);
  }

  // Saluto sempre come primo messaggio (segue la lingua corrente)
  const thread: Msg[] = [{ from: "bot", text: t.greeting }, ...messages];

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open && (
        <div className="flex max-h-[70vh] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10">
          <div className="flex items-center gap-3 bg-[#17493b] px-4 py-3 text-white">
            <Image
              src="/suporte-avatar.png"
              alt=""
              width={40}
              height={40}
              className="size-10 rounded-full bg-white/10 object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-tight">{t.headerName}</p>
              <p className="flex items-center gap-1.5 text-xs text-white/70">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                {t.online}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t.closeChat}
              className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-zinc-50 p-4 text-sm">
            {thread.map((m, i) => (
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
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block rounded-xl bg-[#25D366] px-4 py-2 font-semibold text-white"
                  >
                    {t.waCta}
                  </a>
                )}
              </div>
            ))}
            {typing && (
              <div
                role="status"
                aria-label={t.typing}
                className="flex items-center gap-1 px-2 py-1.5"
              >
                <span className="chat-typing-dot size-2 rounded-full bg-zinc-400" />
                <span className="chat-typing-dot size-2 rounded-full bg-zinc-400" />
                <span className="chat-typing-dot size-2 rounded-full bg-zinc-400" />
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Domande rapide fisse — sempre visibili, non scompaiono */}
          <div className="flex flex-wrap gap-1.5 border-t border-zinc-100 bg-white px-3 pt-2.5">
            {t.quick.map((q) => (
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
              placeholder={t.inputPh}
              className="flex-1 rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-[#17493b]"
            />
            <button
              type="submit"
              aria-label={t.send}
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
        aria-label={open ? t.closeSupport : t.openSupport}
        className="group relative flex flex-col items-center transition-transform hover:scale-105"
      >
        {/* fumetto "Supporto" sopra la testa */}
        <span className="relative mb-1 rounded-xl bg-white px-3 py-1 text-xs font-semibold text-[#17493b] shadow-md">
          {t.bubble}
          <span className="absolute -bottom-1 left-1/2 size-2 -translate-x-1/2 rotate-45 bg-white" />
        </span>
        <Image
          src="/suporte-avatar.png"
          alt={t.bubble}
          width={80}
          height={78}
          className="w-20 object-contain"
        />
      </button>
    </div>
  );
}
