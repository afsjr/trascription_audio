# Actions: Transcrição de áudios do WhatsApp

> Identificador: `001-transcricao-whatsapp`
> Data: `2026-11-10`
> Roadmap: `_reversa_forward/001-transcricao-whatsapp/roadmap.md`

## Resumo

| Métrica | Valor |
|---------|-------|
| Total de ações | 26 |
| Paralelizáveis (`[//]`) | 6 |
| Maior cadeia de dependência | 7 |

## Fase 1, Preparação

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T001 | Criar scaffold Next.js 15 com TypeScript, Tailwind e App Router em `web/` | - | `[//]` | `web/package.json` | 🟡 | `[X]` |
| T002 | Criar configuração de ambiente e exemplo de variáveis | T001 | `[//]` | `web/.env.example` | 🟡 | `[X]` |
| T003 | Criar migração SQL com tabelas, coluna gerada e índices | T001 | `[//]` | `web/db/migrations/001_init.sql` | 🟡 | `[X]` |
| T004 | Criar cliente do banco Neon e repositório de dados | T003 | - | `web/lib/db.ts` | 🟡 | `[X]` |

## Fase 2, Testes

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T005 | Configurar Vitest e testes do schema de resumo e da validação de duração | T001 | `[//]` | `web/vitest.config.ts` | 🟡 | `[X]` |
| T006 | Testar assinatura e verificação do token de sessão | T004 | `[//]` | `web/lib/auth.test.ts` | 🟡 | `[X]` |

## Fase 3, Núcleo

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T007 | Implementar assinatura e verificação HMAC do cookie de sessão | T002 | - | `web/lib/auth.ts` | 🟡 | `[X]` |
| T008 | Implementar middleware de proteção de páginas e APIs | T007 | - | `web/middleware.ts` | 🟡 | `[X]` |
| T009 | Implementar rotas de login e logout com bloqueio por tentativas | T008 | - | `web/app/api/login/route.ts` | 🟡 | `[X]` |
| T010 | Criar tela de login com estados de erro e carregamento | T009 | - | `web/app/login/page.tsx` | 🟡 | `[X]` |
| T011 | Implementar validação de áudio no servidor com `music-metadata` | T002 | - | `web/lib/audio.ts` | 🟡 | `[X]` |
| T012 | Implementar cliente de transcrição com Groq e fallback OpenAI | T004 | - | `web/lib/transcription.ts` | 🟡 | `[X]` |
| T013 | Implementar geração de resumo com schema Zod e fallback | T004 | - | `web/lib/summary.ts` | 🟡 | `[X]` |
| T014 | Implementar rota orquestradora de transcrição com limpeza do Blob | T011 | - | `web/app/api/transcribe/route.ts` | 🟡 | `[X]` |
| T015 | Implementar rota de token de upload do Blob | T008 | - | `web/app/api/blob-upload/route.ts` | 🟡 | `[X]` |
| T016 | Criar componente de upload com validação de duração no cliente | T015 | - | `web/components/upload-form.tsx` | 🟡 | `[X]` |
| T017 | Criar página inicial com upload e últimos registros | T016 | - | `web/app/page.tsx` | 🟡 | `[X]` |

## Fase 4, Integração

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T018 | Implementar listagem e detalhe de transcrições | T014 | - | `web/app/api/transcripts/route.ts` | 🟡 | `[X]` |
| T019 | Implementar busca full-text com destaque | T018 | - | `web/app/api/search/route.ts` | 🟡 | `[X]` |
| T020 | Implementar exclusão de transcrição | T018 | - | `web/app/api/transcripts/[id]/route.ts` | 🟡 | `[X]` |
| T021 | Criar página de histórico com busca e paginação | T019 | - | `web/app/historico/page.tsx` | 🟡 | `[X]` |
| T022 | Criar página de detalhe com transcrição e resumo | T020 | - | `web/app/transcricao/[id]/page.tsx` | 🟡 | `[X]` |

## Fase 5, Polimento

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T023 | Padronizar mensagens de erro em português e estados vazios | T022 | `[//]` | `web/lib/messages.ts` | 🟡 | `[X]` |
| T024 | Adicionar registro de eventos sem conteúdo sensível | T014 | `[//]` | `web/lib/logger.ts` | 🟡 | `[X]` |
| T025 | Escrever README com deploy, variáveis e teste manual | T022 | `[//]` | `web/README.md` | 🟡 | `[X]` |
| T026 | Rodar lint, testes e build e corrigir falhas | T023 | - | `web/` | 🟡 | `[X]` |

## Notas de execução

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-11-10 | Versão inicial gerada por `/reversa-to-do` | reversa |
