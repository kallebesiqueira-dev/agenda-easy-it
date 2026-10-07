import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Termos de Uso — Agenda Easy" };

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-16 text-zinc-900">
      <h1 className="text-3xl font-bold">Termos de Uso</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Última atualização: 6 de outubro de 2026
      </p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-zinc-700">
        <section>
          <h2 className="mb-1 font-semibold text-zinc-900">1. O serviço</h2>
          <p>
            O Agenda Easy é uma plataforma de agendamento online para pequenos
            negócios. O negócio assinante cadastra serviços, equipe e horários
            e recebe uma página pública onde seus clientes reservam horários,
            mediante pagamento de um sinal de 50% do valor do serviço.
          </p>
        </section>
        <section>
          <h2 className="mb-1 font-semibold text-zinc-900">2. Assinatura e teste grátis</h2>
          <p>
            O uso do painel exige assinatura (Plano Único, R$ 49,90/mês), com 7
            dias de teste grátis a partir da criação do negócio. Ao fim do
            teste, o acesso é bloqueado até a confirmação do pagamento. A
            cobrança é processada pela Asaas. O cancelamento pode ser feito a
            qualquer momento e interrompe as cobranças seguintes.
          </p>
        </section>
        <section>
          <h2 className="mb-1 font-semibold text-zinc-900">3. Pagamentos entre negócio e cliente final</h2>
          <p>
            O sinal de 50% é combinado e recebido diretamente entre o negócio e
            o seu cliente (ex.: Pix do próprio negócio). O Agenda Easy não
            intermedeia, retém ou garante esses valores, nem se responsabiliza
            por reembolsos entre as partes.
          </p>
        </section>
        <section>
          <h2 className="mb-1 font-semibold text-zinc-900">4. Responsabilidades</h2>
          <p>
            O negócio é responsável pelas informações publicadas em sua página
            (serviços, preços, horários) e pelo atendimento dos agendamentos. O
            Agenda Easy fornece a plataforma &quot;como está&quot;, empregando
            esforços razoáveis para mantê-la disponível e segura.
          </p>
        </section>
        <section>
          <h2 className="mb-1 font-semibold text-zinc-900">5. Encerramento</h2>
          <p>
            Contas que violem estes termos ou a legislação podem ser suspensas.
            Você pode encerrar sua conta a qualquer momento solicitando pelo
            e-mail de suporte.
          </p>
        </section>
        <section>
          <h2 className="mb-1 font-semibold text-zinc-900">6. Contato</h2>
          <p>
            Dúvidas sobre estes termos: kallebesiqueira@gmail.com. Veja também
            a nossa{" "}
            <Link href="/privacidade" className="underline">
              Política de Privacidade
            </Link>
            .
          </p>
        </section>
      </div>

      <p className="mt-10 text-sm">
        <Link href="/" className="underline">
          ← Voltar ao início
        </Link>
      </p>
    </main>
  );
}
