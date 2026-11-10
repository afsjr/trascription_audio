# Roadmap: Transcrição de áudios do WhatsApp

> Identificador: `001-transcricao-whatsapp`
> Data: `2026-11-10`
> Requirements: `_reversa_forward/001-transcricao-whatsapp/requirements.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. Resumo da abordagem

🟡 Construir uma aplicação Next.js (App Router) implantada no Vercel Hobby, com o código em `web/`. O navegador envia o áudio direto ao Vercel Blob (evitando o payload de 4,5 MB); a função `/api/transcribe` valida a duração com `music-metadata`, chama o Groq (`whisper-large-v3-turbo`) com fallback para a OpenAI, gera o resumo estruturado por LLM validado com Zod, persiste no Neon Postgres e apaga o Blob. O histórico usa full-text nativo do Postgres com `tsvector` em português, e o acesso é protegido por senha única com cookie HMAC httpOnly.

## 2. Princípios aplicados

| Princípio | Como a feature se relaciona | Status |
|-----------|------------------------------|--------|
| 🟡 n/a | 🟡 Não há `.reversa/principles.md` no projeto | 🟡 n/a |

## 3. Decisões técnicas

| ID | Decisão | Justificativa | Alternativas descartadas | Confidência |
|----|---------|----------------|--------------------------|-------------|
| D-01 | 🟡 Next.js 15 App Router + TypeScript em `web/` | 🟡 Deploy simples no Vercel e um só runtime | 🟡 Vite SPA + funções separadas | 🟡 |
| D-02 | 🟡 Upload direto ao Vercel Blob no cliente | 🟡 Contorna o limite de 4,5 MB do request | 🟡 Enviar o binário pelo route handler | 🟡 |
| D-03 | 🟡 Groq `whisper-large-v3-turbo` como transcrição padrão | 🟡 Latência e custo menores para 5 min | 🟡 OpenAI `whisper-1` como padrão | 🟡 |
| D-04 | 🟡 OpenAI `gpt-4o-mini` como resumidor padrão, Groq `llama-3.3-70b-versatile` como fallback | 🟡 Resumo detalhado com JSON confiável e custo baixo | 🟡 Só Groq, só OpenAI | 🟡 |
| D-05 | 🟡 Neon Postgres com `pg` + `attachDatabasePool` de `@vercel/functions` | 🟡 Recomendação do skill Neon para Vercel com Fluid compute; pool reutilizado por instância | 🟡 `@neondatabase/serverless`, Supabase, Vercel KV | 🟡 |
| D-06 | 🟡 Coluna gerada `tsvector('portuguese', ...)` + índice GIN | 🟡 Busca consistente e simples, sem serviço extra | 🟡 Busca vetorial, ILIKE | 🟡 |
| D-07 | 🟡 Autenticação própria com HMAC via Web Crypto | 🟡 Sem dependência extra e funciona no middleware | 🟡 Auth.js, Vercel Password Protection | 🟡 |
| D-08 | 🟡 `music-metadata` para validar duração no servidor | 🟡 Lê o buffer e impede custo com áudio fora do limite | 🟡 Confiar só no cliente | 🟡 |
| D-09 | 🟡 Zod para validar o JSON do resumo | 🟡 Impede persistir saída fora do contrato | 🟡 Parsing manual | 🟡 |
| D-10 | 🟡 Apagar o Blob após a transcrição | 🟡 Privacidade e custo de armazenamento | 🟡 Retenção temporária de 24 h | 🟡 |

## 4. Premissas

| Premissa | Origem (`requirements.md` seção) | Risco se errada |
|----------|----------------------------------|-----------------|
| 🟡 O Opus exportado pelo WhatsApp é aceito pelas APIs sem transcodificação | 🟡 Seção 10, formatos | 🟡 Transcodificação necessária e adiada |
| 🟡 5 min de áudio cabe no tempo de 300 s da função e no Blob | 🟡 Seção 6, infraestrutura | 🟡 Necessidade de fila externa |
| 🟡 A precisão PT-BR do Groq basta para busca e resumo | 🟡 Seção 10, lacunas | 🟡 Troca de modelo ou revisão manual |

## 5. Delta arquitetural

| Componente | Arquivo de origem no legado | Tipo de mudança | Resumo |
|------------|------------------------------|-----------------|--------|
| 🟡 Upload e validação | 🟡 `_reversa_sdd/sdd/upload-e-validacao.md` | 🟡 componente-novo | 🟡 Página inicial, upload ao Blob e validação de duração. |
| 🟡 Transcrição | 🟡 `_reversa_sdd/sdd/transcricao.md` | 🟡 componente-novo | 🟡 Cliente Groq/OpenAI e rota orquestradora. |
| 🟡 Resumo detalhado | 🟡 `_reversa_sdd/sdd/resumo-detalhado.md` | 🟡 componente-novo | 🟡 Prompt, schema Zod e fallback. |
| 🟡 Histórico e busca | 🟡 `_reversa_sdd/sdd/historico-e-busca.md` | 🟡 componente-novo | 🟡 Lista, detalhe, busca full-text e exclusão. |
| 🟡 Acesso protegido | 🟡 `_reversa_sdd/sdd/acesso-protegido.md` | 🟡 componente-novo | 🟡 Middleware, login e logout. |

## 6. Delta no modelo de dados

- Resumo das mudanças: 🟡 quatro tabelas novas (`uploads`, `transcripts`, `summaries`, `access_attempts`), com `search_vector` gerado e índice GIN.
- Detalhe completo em: `_reversa_forward/001-transcricao-whatsapp/data-delta.md`

## 7. Delta de contratos externos

| Contrato | Tipo | Arquivo de detalhe |
|----------|------|--------------------|
| 🟡 API interna (login, transcrição, histórico, busca) | 🟡 HTTP | `_reversa_forward/001-transcricao-whatsapp/interfaces/api.md` |
| 🟡 Vercel Blob | 🟡 HTTP/SDK | `_reversa_forward/001-transcricao-whatsapp/interfaces/api.md` |

## 8. Plano de migração

1. 🟡 Criar projeto no Vercel com Root Directory `web/`.
2. 🟡 Provisionar Vercel Blob e Neon Postgres.
3. 🟡 Rodar o SQL de criação das tabelas e índices.
4. 🟡 Configurar as variáveis de ambiente.
5. 🟡 Fazer o deploy e validar com um áudio real.

## 9. Riscos e mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| 🟡 API rejeitar Opus do WhatsApp | alto | média | 🟡 Testar cedo; prever fallback de decodificação |
| 🟡 JSON do resumo inválido | médio | média | 🟡 Zod + segunda tentativa + resumo mínimo |
| 🟡 Custo inesperado de API | médio | baixa | 🟡 Limite de 5 min, áudio apagado, logs de tokens |
| 🟡 Blob órfão após falha | baixo | média | 🟡 Apagar no `finally` e no tratamento de erro |

## 10. Critério de pronto

- [ ] Todas as ações do `actions.md` marcadas `[X]`
- [ ] `npm run lint` e `npm run build` passando em `web/`
- [ ] `regression-watch.md` gerado
- [ ] Teste manual com um áudio real do WhatsApp documentado no `onboarding.md`

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-11-10 | Versão inicial gerada por `/reversa-plan` | reversa |
