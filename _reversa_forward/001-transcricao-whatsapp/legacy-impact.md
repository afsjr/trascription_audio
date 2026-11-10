# Legacy Impact: Transcrição de áudios do WhatsApp

> Feature greenfield, sem legado pré-existente. Âncora: prd.md + specs SDD.
> Identificador: `001-transcricao-whatsapp`
> Data: 2026-11-10
> Política de edição: `allowLegacyEdits: true`, `allowedPaths: []` (liberação irrestrita)

## 1. Arquivos afetados

| Arquivo afetado | Componente | Tipo | Severidade | Justificativa |
|-----------------|------------|------|------------|---------------|
| `web/app/page.tsx` | Upload e validação | componente-novo | LOW | Página inicial com envio e últimos registros |
| `web/components/upload-form.tsx` | Upload e validação | componente-novo | LOW | Upload direto ao Blob e validação de duração |
| `web/lib/audio.ts` | Upload e validação | componente-novo | LOW | Regras de formato, tamanho e duração |
| `web/app/api/transcribe/route.ts` | Transcrição | componente-novo | LOW | Orquestra validação, transcrição, resumo e limpeza |
| `web/lib/transcription.ts` | Transcrição | componente-novo | LOW | Cliente Groq com fallback OpenAI |
| `web/lib/summary.ts` | Resumo detalhado | componente-novo | LOW | Geração e validação do resumo |
| `web/lib/summary-schema.ts` | Resumo detalhado | componente-novo | LOW | Schema Zod dos seis blocos |
| `web/app/historico/page.tsx` | Histórico e busca | componente-novo | LOW | Lista, busca e paginação |
| `web/app/api/search/route.ts` | Histórico e busca | componente-novo | LOW | Busca full-text com destaque |
| `web/lib/db.ts` | Histórico e busca | componente-novo | LOW | Repositório Postgres |
| `web/middleware.ts` | Acesso protegido | componente-novo | LOW | Proteção de páginas e APIs |
| `web/lib/auth.ts` | Acesso protegido | componente-novo | LOW | Sessão HMAC e senha |
| `web/app/api/login/route.ts` | Acesso protegido | componente-novo | LOW | Login com bloqueio por tentativas |
| `web/db/migrations/001_init.sql` | Histórico e busca | componente-novo | LOW | Tabelas, coluna gerada e índices |

## 2. Diff conceitual

🟡 Todos os componentes são novos; não houve alteração de regra existente. A aplicação nasce com cinco componentes coesos, cada um rastreável a uma spec em `_reversa_sdd/sdd/`.

## 3. Preservadas

🟡 Nenhuma regra de legado; não havia código de aplicação antes desta feature.

## 4. Modificadas

🟡 Nenhuma.
