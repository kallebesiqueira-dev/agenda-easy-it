/**
 * Landing pública do Agenda Easy.
 *
 * Toda a copy reflete o produto real: página pública /{slug}, sinal de 50%
 * via Asaas, Plano Único (PLAN) e teste grátis (TRIAL_DAYS). Se a política
 * de preço/trial mudar em src/lib/billing, esta página acompanha sozinha.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { Fraunces, Instrument_Sans } from "next/font/google";
import { ScrollBubbles } from "@/components/scroll-bubbles";
import { SupportChat } from "@/components/support-chat";
import { PLAN, TRIAL_DAYS } from "@/lib/billing";
import { formatBRL } from "@/lib/money";

const display = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz", "SOFT", "WONK"],
  variable: "--font-landing-display",
});

const sans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-landing-sans",
});

export const metadata: Metadata = {
  title: "Agenda Easy — Sua agenda cheia, seu WhatsApp em paz",
};

const SEGMENTS = [
  "Salões de beleza",
  "Barbearias",
  "Clínicas",
  "Manicures",
  "Tatuadores",
  "Fisioterapeutas",
  "Dentistas",
  "Pet shops",
  "Personal trainers",
  "Professores particulares",
  "Consultórios",
  "Estúdios",
  "E qualquer serviço com hora marcada",
];

const STEPS = [
  {
    title: "Crie sua conta",
    body: `Cadastre seu negócio, seus serviços (preço, duração, foto) e os horários de funcionamento. Leva menos de dez minutos — e os primeiros ${TRIAL_DAYS} dias são por nossa conta.`,
  },
  {
    title: "Compartilhe seu link",
    body: "Você ganha uma página pública com o endereço do seu negócio. Cole no Instagram, no WhatsApp, onde seus clientes estiverem. Eles escolhem serviço, profissional e horário sozinhos.",
  },
  {
    title: "Receba o sinal, confirme o horário",
    body: "Para reservar, o cliente paga um sinal de 50% do serviço. Quem pagou, aparece. Sua agenda do dia fica organizada no painel, sem vaivém de mensagens.",
  },
];

const FEATURES = [
  {
    title: "Página de agendamento com a sua cara",
    body: "Nome, descrição e serviços com foto em um link público só seu. O cliente reserva sem baixar aplicativo e sem criar conta.",
  },
  {
    title: "Sinal de 50% contra furos",
    body: "A reserva só vale depois que o cliente paga metade do valor do serviço. Chega de bloquear horário para quem não aparece.",
  },
  {
    title: "Agenda do dia no painel",
    body: "Veja quem vem hoje, a que horas, qual serviço e quanto já foi pago de sinal — tudo em uma tela.",
  },
  {
    title: "Equipe e horários por profissional",
    body: "Cadastre cada profissional do seu time e deixe o cliente escolher com quem quer ser atendido.",
  },
  {
    title: "Serviços do seu jeito",
    body: "Preço, duração e foto de cada serviço. O tempo de cada atendimento é respeitado na grade de horários automaticamente.",
  },
  {
    title: "Horário de funcionamento real",
    body: "Defina os dias e janelas de atendimento do seu negócio. Só aparecem para o cliente os horários que realmente existem.",
  },
];

const PLAN_BULLETS = [
  "Página pública de agendamento",
  "Agendamentos e sinal de 50% ilimitados",
  "Serviços, equipe e horários sem limite",
  `${TRIAL_DAYS} dias grátis, sem cartão de crédito`,
  "Cancele quando quiser",
];

export default function LandingPage() {
  return (
    <div
      className={`${display.variable} ${sans.variable} min-h-dvh bg-[#f6f1e7] font-[family-name:var(--font-landing-sans)] text-[#221c15]`}
    >
      {/* textura de papel sutil */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(#221c15 0.5px, transparent 0.5px)",
          backgroundSize: "22px 22px",
          maskImage:
            "linear-gradient(to bottom, transparent, black 30%, transparent)",
        }}
      />

      <header className="sticky top-0 z-40 border-b border-[#221c15]/5 bg-[#f6f1e7]/85 px-5 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between py-4">
        <p className="font-[family-name:var(--font-landing-display)] text-xl font-semibold tracking-tight">
          agenda<span className="italic text-[#17493b]">easy</span>
          <span className="text-[#e4572e]">.</span>
        </p>
        <nav className="flex items-center gap-2 text-sm font-medium sm:gap-5">
          <a href="#como-funciona" className="hidden hover:underline sm:block">
            Como funciona
          </a>
          <a href="#preco" className="hidden hover:underline sm:block">
            Preço
          </a>
          <Link href="/login" className="px-2 py-2 hover:underline">
            Entrar
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-[#221c15] px-4 py-2 text-[#f6f1e7] transition-colors hover:bg-[#17493b]"
          >
            Criar conta
          </Link>
        </nav>
        </div>
      </header>

      <ScrollBubbles />

      {/* ---------------- Hero ---------------- */}
      <section className="relative mx-auto grid w-full max-w-6xl gap-12 px-5 pb-20 pt-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pt-16">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/home.png"
            alt="Agenda Easy — agendamento online"
            className="landing-rise w-full"
          />
          <div
            className="landing-rise mt-8 flex flex-wrap items-center gap-4"
            style={{ animationDelay: "160ms" }}
          >
            <Link
              href="/signup"
              className="rounded-full bg-[#e4572e] px-7 py-3.5 text-base font-semibold text-white shadow-[0_8px_24px_-8px_rgba(228,87,46,0.6)] transition-transform hover:-translate-y-0.5"
            >
              Começar grátis por {TRIAL_DAYS} dias
            </Link>
            <p className="text-sm text-[#221c15]/60">
              Sem cartão de crédito
              <br className="sm:hidden" /> no cadastro.
            </p>
          </div>
        </div>

        {/* Mock da página pública de agendamento */}
        <div
          aria-hidden
          className="landing-rise relative mx-auto w-full max-w-sm"
          style={{ animationDelay: "320ms" }}
        >
          <div className="absolute -inset-6 rounded-[2rem] bg-[#17493b]/10 [transform:rotate(-2deg)]" />
          <div className="relative rounded-3xl border border-[#221c15]/10 bg-white p-5 shadow-[0_24px_60px_-24px_rgba(34,28,21,0.35)]">
            <p className="inline-block rounded-full bg-[#f6f1e7] px-3 py-1 font-mono text-xs text-[#221c15]/70">
              agenda-easy.vercel.app/studio-ana
            </p>
            <p className="mt-4 font-[family-name:var(--font-landing-display)] text-lg font-semibold">
              Studio Ana — Beleza &amp; Estética
            </p>
            <div className="mt-3 space-y-2">
              {[
                ["Corte + escova", "1h", "R$ 90,00"],
                ["Coloração", "2h", "R$ 180,00"],
                ["Manicure", "45min", "R$ 45,00"],
              ].map(([name, duration, price]) => (
                <div
                  key={name}
                  className="flex items-center justify-between rounded-xl border border-[#221c15]/10 px-3 py-2.5 text-sm first:border-[#17493b] first:bg-[#17493b]/5"
                >
                  <span className="font-medium">{name}</span>
                  <span className="text-[#221c15]/50">
                    {duration} · {price}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[#221c15]/50">
              Horários de amanhã
            </p>
            <div className="mt-2 grid grid-cols-4 gap-2 text-center text-sm">
              {["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"].map(
                (t, i) => (
                  <span
                    key={t}
                    className={`rounded-lg border px-2 py-1.5 ${
                      i === 3
                        ? "border-[#e4572e] bg-[#e4572e] font-semibold text-white"
                        : "border-[#221c15]/10"
                    }`}
                  >
                    {t}
                  </span>
                )
              )}
            </div>
            <div className="mt-4 rounded-xl bg-[#221c15] px-4 py-3 text-center text-sm font-semibold text-[#f6f1e7]">
              Reservar com sinal de R$ 45,00
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Marquee de segmentos ---------------- */}
      <div className="relative overflow-hidden border-y border-[#221c15]/10 bg-[#17493b] py-3 text-[#f6f1e7]">
        <div className="landing-marquee flex w-max">
          {[0, 1].map((copy) => (
            <div
              key={copy}
              className="flex shrink-0 items-center text-sm font-medium uppercase tracking-[0.18em]"
            >
              {SEGMENTS.map((s) => (
                <span key={s} className="flex items-center">
                  <span className="px-5">{s}</span>
                  <span className="text-[#e4572e]">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ---------------- Como funciona ---------------- */}
      <section
        id="como-funciona"
        className="relative mx-auto w-full max-w-6xl px-5 py-24"
      >
        <h2
          data-bubble
          className="text-center font-[family-name:var(--font-landing-display)] text-4xl font-semibold tracking-tight sm:text-5xl"
        >
          Do cadastro ao primeiro
          <br />
          agendamento <em className="text-[#e4572e]">em um dia.</em>
        </h2>
        <div className="mt-12 grid gap-10 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <div key={step.title} data-bubble className="relative">
              <p className="font-[family-name:var(--font-landing-display)] text-6xl font-semibold italic text-[#17493b]/20">
                {i + 1}
              </p>
              <h3 className="mt-2 text-xl font-semibold">{step.title}</h3>
              <p className="mt-2 leading-relaxed text-[#221c15]/70">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- Recursos ---------------- */}
      <section className="relative border-y border-[#221c15]/10 bg-[#fffdf8]">
        <div className="mx-auto w-full max-w-6xl px-5 py-24">
          <h2
            data-bubble
            className="text-center font-[family-name:var(--font-landing-display)] text-4xl font-semibold tracking-tight sm:text-5xl"
          >
            Tudo que o balcão faz,
            <br />
            <em className="text-[#17493b]">sem precisar do balcão.</em>
          </h2>
          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-[#221c15]/10 bg-[#221c15]/10 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                data-bubble
                className="bg-[#fffdf8] p-7 transition-colors hover:bg-[#f6f1e7]"
              >
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#221c15]/70">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Preço ---------------- */}
      <section id="preco" className="relative mx-auto w-full max-w-6xl px-5 py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div data-bubble>
            <h2 className="font-[family-name:var(--font-landing-display)] text-4xl font-semibold tracking-tight sm:text-5xl">
              Um plano só.
              <br />
              <em className="text-[#e4572e]">Tudo incluso.</em>
            </h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-[#221c15]/70">
              Sem degraus de plano, sem recurso bloqueado, sem surpresa na
              fatura. Um único sinal de 50% recebido a mais no mês já paga a
              assinatura.
            </p>
          </div>
          <div data-bubble className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-[#e4572e]/10 [transform:rotate(1.5deg)]" />
            <div className="relative rounded-3xl border border-[#221c15]/10 bg-white p-8 shadow-[0_24px_60px_-24px_rgba(34,28,21,0.3)]">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#17493b]">
                {PLAN.name}
              </p>
              <p className="mt-3 font-[family-name:var(--font-landing-display)] text-5xl font-semibold tracking-tight">
                {formatBRL(PLAN.priceMinor)}
                <span className="text-xl font-normal text-[#221c15]/50">
                  {" "}
                  /mês
                </span>
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                {PLAN_BULLETS.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="mt-0.5 text-[#e4572e]">✦</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="mt-8 block rounded-full bg-[#221c15] py-3.5 text-center font-semibold text-[#f6f1e7] transition-colors hover:bg-[#17493b]"
              >
                Testar grátis por {TRIAL_DAYS} dias
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- CTA final ---------------- */}
      <section className="relative overflow-hidden bg-[#17493b] text-[#f6f1e7]">
        <div data-bubble className="mx-auto w-full max-w-6xl px-5 py-24 text-center">
          <h2 className="mx-auto max-w-2xl font-[family-name:var(--font-landing-display)] text-4xl font-semibold tracking-tight sm:text-5xl">
            Enquanto você atende,
            <br />
            <em className="text-[#e4572e]">sua página agenda.</em>
          </h2>
          <Link
            href="/signup"
            className="mt-10 inline-block rounded-full bg-[#e4572e] px-8 py-4 text-lg font-semibold text-white transition-transform hover:-translate-y-0.5"
          >
            Criar minha página de agendamento
          </Link>
          <p className="mt-4 text-sm text-[#f6f1e7]/60">
            {TRIAL_DAYS} dias grátis · {formatBRL(PLAN.priceMinor)}/mês depois ·
            cancele quando quiser
          </p>
        </div>
      </section>

      <footer className="relative bg-[#12130f] px-5 py-8 text-sm text-[#f6f1e7]/50">
        <div className="mx-auto w-full max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="font-[family-name:var(--font-landing-display)] text-lg text-[#f6f1e7]">
              agenda<span className="italic">easy</span>
              <span className="text-[#e4572e]">.</span>
            </p>
            <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              <Link href="/login" className="hover:text-[#f6f1e7]">
                Entrar
              </Link>
              <Link href="/signup" className="hover:text-[#f6f1e7]">
                Criar conta
              </Link>
              <Link href="/termos" className="hover:text-[#f6f1e7]">
                Termos
              </Link>
              <Link href="/privacidade" className="hover:text-[#f6f1e7]">
                Privacidade
              </Link>
            </nav>
          </div>
          <p className="mt-6 border-t border-[#f6f1e7]/10 pt-5 text-center text-xs">
            © {new Date().getFullYear()} Agenda Easy · Desenvolvido por{" "}
            <a
              href="https://digitalpauloafonso.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#f6f1e7] hover:underline"
            >
              Digital Paulo Afonso
            </a>
          </p>
        </div>
      </footer>

      <SupportChat />
    </div>
  );
}
