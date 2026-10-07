# SKILL — Guia para agentes e contribuidores

## Next.js deste projeto

Este projeto usa uma versão do Next.js com breaking changes em relação a versões antigas — APIs, convenções e estrutura de arquivos podem diferir do que você conhece. **Leia o guia relevante em `node_modules/next/dist/docs/` antes de escrever código** e respeite os avisos de deprecação.

Observação: o `next dev` gera automaticamente um arquivo `AGENTS.md` na raiz com este mesmo aviso (ver `node_modules/next/dist/server/lib/generate-agent-files.js`). Ele está no `.gitignore` — não o commite.

## Convenções do projeto

- **Dinheiro**: sempre em centavos (`price_minor`), formatação via `src/lib/money`.
- **Decisões de produto** (preço do plano, trial, carência) concentradas em `src/lib/billing` — mude os valores lá, não a lógica.
- **Valores de reserva** nunca são confiados do cliente: `/api/public/*` revalida disponibilidade e recalcula preços no servidor.
- **RLS** em todas as tabelas; o service role (`SUPABASE_SECRET_KEY`) só é usado em código de servidor (`src/lib/supabase/admin.ts`).
- **Slots fixos de 30 min** na grade de horários (decisão de produto).
- Comentários e UI em **pt-BR**.

## Comandos úteis

```bash
npm run dev                      # dev server na porta 8888
npm run build                    # build + typecheck
npx supabase start               # Supabase local (Docker)
npx supabase db push             # aplica migrations no projeto linkado
```

Gotcha conhecido: se o build falhar com erro de sintaxe em `.next/dev/types/validator.ts`, o arquivo gerado pelo dev server corrompeu — delete-o e rode o build de novo.
