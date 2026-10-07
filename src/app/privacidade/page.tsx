import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidade — Agenda Easy",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-16 text-zinc-900">
      <h1 className="text-3xl font-bold">Política de Privacidade</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Última atualização: 6 de outubro de 2026
      </p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-zinc-700">
        <section>
          <h2 className="mb-1 font-semibold text-zinc-900">1. Dados que coletamos</h2>
          <p>
            Dos negócios assinantes: e-mail, dados do negócio (nome, endereço,
            contatos) e CPF/CNPJ do titular para emissão das cobranças da
            assinatura (processadas pela Asaas). Dos clientes finais que
            agendam: nome e telefone informados na reserva — usados apenas para
            identificar o agendamento junto ao negócio escolhido.
          </p>
        </section>
        <section>
          <h2 className="mb-1 font-semibold text-zinc-900">2. Uso dos dados</h2>
          <p>
            Usamos os dados exclusivamente para operar a plataforma: exibir a
            página de agendamento, organizar a agenda do negócio, processar a
            assinatura e comunicar assuntos da conta. Não vendemos dados a
            terceiros.
          </p>
        </section>
        <section>
          <h2 className="mb-1 font-semibold text-zinc-900">3. Compartilhamento</h2>
          <p>
            Compartilhamos dados apenas com os provedores necessários à
            operação: Supabase (banco de dados e autenticação), Vercel
            (hospedagem) e Asaas (cobranças da assinatura), além de hipóteses
            exigidas por lei.
          </p>
        </section>
        <section>
          <h2 className="mb-1 font-semibold text-zinc-900">4. Seus direitos (LGPD)</h2>
          <p>
            Você pode solicitar acesso, correção ou exclusão dos seus dados a
            qualquer momento pelo e-mail kallebesiqueira@gmail.com. Clientes
            finais podem também solicitar diretamente ao negócio onde
            agendaram.
          </p>
        </section>
        <section>
          <h2 className="mb-1 font-semibold text-zinc-900">5. Segurança e retenção</h2>
          <p>
            Os dados ficam armazenados em provedores com criptografia em
            trânsito e em repouso, com acesso restrito por regras de permissão
            por negócio (RLS). Mantemos os dados enquanto a conta existir ou
            enquanto necessário por obrigação legal.
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
