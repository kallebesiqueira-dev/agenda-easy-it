"use client";

/**
 * Chat de suporte flutuante (canto inferior direito).
 * Responde dúvidas simples com tom humano; dúvidas fora do script
 * direcionam para o WhatsApp do suporte.
 */

import { useEffect, useRef, useState } from "react";

const WHATSAPP_URL =
  "https://wa.me/5575999689825?text=" +
  encodeURIComponent("Olá! Preciso de ajuda com o Agenda Easy.");

interface Msg {
  from: "bot" | "user";
  text: string;
  whatsapp?: boolean;
}

const GREETING: Msg = {
  from: "bot",
  text: "Oi! 👋 Eu sou o Gui, do suporte do Agenda Easy. Posso te ajudar com preço, teste grátis, agendamentos, pagamentos... o que você precisa?",
};

const QUICK = ["Quanto custa?", "Como funciona o teste grátis?", "Como recebo o sinal?", "Falar com um humano"];

/** Remove acentos e baixa a caixa para o matching. */
const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const FAQ: { match: RegExp; reply: string; whatsapp?: boolean }[] = [
  {
    match: /(preco|quanto custa|valor|mensalidade|plano|caro)/,
    reply:
      "O plano é único: R$ 49,90/mês com tudo incluso — página de agendamento, agenda, equipe e relatórios, sem limites. E você começa com 7 dias grátis, sem cartão. 😉",
  },
  {
    match: /(teste|gratis|trial|experimentar)/,
    reply:
      "Ao criar sua conta você ganha 7 dias grátis com acesso total — sem pedir cartão. Só assina se gostar. Cria em 2 minutos em agenda-easy.vercel.app/signup",
  },
  {
    match: /(criar conta|cadastr|comecar|como funciona|começar)/,
    reply:
      "É rapidinho: 1) crie a conta, 2) cadastre serviços, equipe e horários, 3) publique nas Configurações e compartilhe seu link. Seus clientes agendam sozinhos e pagam o sinal por Pix. 🚀",
  },
  {
    match: /(sinal|pix|receb|pagamento|cobra|deposito)/,
    reply:
      "O cliente paga um sinal de 50% por Pix direto na SUA chave (cadastrada nas Configurações) para confirmar o horário. O restante ele paga no local, em dinheiro ou cartão. Nada passa pela gente — o dinheiro cai direto pra você. 💰",
  },
  {
    match: /(link|pagina|divulg|publicar|instagram|nao esta public|não está public|404)/,
    reply:
      'Seu link fica no formato agenda-easy.vercel.app/seu-negocio. Importante: ele só fica no ar depois que você marca "Página publicada" lá em Configurações e salva. Aí é só colar na bio do Instagram! 📲',
  },
  {
    match: /(cancelar assinatura|cancelar plano|parar de pagar)/,
    reply:
      "Você pode cancelar quando quiser, sem multa. Me chama no WhatsApp que a gente resolve na hora, tá?",
    whatsapp: true,
  },
  {
    match: /(cancelar|desmarcar|remarcar)/,
    reply:
      "O cliente pode cancelar sozinho pelo link que recebe na confirmação (até 2h antes do horário). Você também pode cancelar qualquer agendamento pelo painel, na Agenda. O horário volta a ficar livre automaticamente.",
  },
  {
    match: /(horario|turno|disponib|aparece.*hora|sem hora)/,
    reply:
      "Os horários que o cliente vê são o cruzamento do funcionamento do negócio (aba Horários) com os turnos de cada profissional (aba Equipe → Turnos). Se não aparecer nenhum horário, confere se o profissional tem turnos cadastrados. 😉",
  },
  {
    match: /(foto|imagem|logo|perfil)/,
    reply:
      "Dá pra personalizar tudo: logo em Configurações, foto de cada serviço em Serviços → Editar, e foto do profissional clicando no avatar dele em Equipe.",
  },
  {
    match: /(google|entrar com)/,
    reply:
      'Sim! Dá pra entrar com a conta Google — é só clicar em "Continuar com o Google" na tela de login. Sem senha pra decorar. ✌️',
  },
  {
    match: /(senha|esqueci|nao consigo entrar|não consigo entrar)/,
    reply:
      'Sem estresse: na tela de login, clica em "Esqueci minha senha" que a gente te manda um link por e-mail pra criar uma nova.',
  },
  {
    match: /(lembrete|email|e-mail|notificac)/,
    reply:
      "Quando o cliente deixa o e-mail na reserva, ele recebe a confirmação na hora e um lembrete no dia anterior — tudo automático. Menos furo na agenda! ⏰",
  },
  {
    match: /(humano|atendente|pessoa|whats|falar com|suporte|ajuda)/,
    reply: "Claro! Me chama no WhatsApp que te atendo pessoalmente: 👇",
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
    text: "Boa pergunta! Essa é melhor resolver com a nossa equipe pra não te passar informação errada. Me chama no WhatsApp: 👇",
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
              <p className="font-semibold leading-tight">Gui · Suporte</p>
              <p className="flex items-center gap-1.5 text-xs text-white/70">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                online agora
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar chat"
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
                    Chamar no WhatsApp
                  </a>
                )}
              </div>
            ))}
            {typing && (
              <div className="w-16 rounded-2xl rounded-tl-sm bg-white px-3.5 py-2.5 text-zinc-400 shadow-sm">
                <span className="animate-pulse">digitando…</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Dúvidas rápidas fixas — sempre visíveis, não somem */}
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
              placeholder="Escreva sua dúvida…"
              className="flex-1 rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-[#17493b]"
            />
            <button
              type="submit"
              aria-label="Enviar"
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
        aria-label={open ? "Fechar suporte" : "Abrir suporte"}
        className="group relative flex flex-col items-center transition-transform hover:scale-105"
      >
        {/* balão "Suporte" acima da cabeça */}
        <span className="relative mb-1 rounded-xl bg-white px-3 py-1 text-xs font-semibold text-[#17493b] shadow-md">
          Suporte
          <span className="absolute -bottom-1 left-1/2 size-2 -translate-x-1/2 rotate-45 bg-white" />
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/suporte-avatar.png"
          alt="Suporte"
          className="w-20 object-contain"
        />
      </button>
    </div>
  );
}
