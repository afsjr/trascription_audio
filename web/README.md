# Transcrição de áudios do WhatsApp

Aplicação web pessoal para transcrever, resumir e buscar áudios de até 5 minutos
exportados do WhatsApp. O áudio é apagado após a transcrição.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind
- Vercel Hobby (funções de até 300 s)
- Vercel Blob (upload direto do cliente)
- Groq `whisper-large-v3-turbo` com fallback OpenAI para transcrição
- OpenAI `gpt-4o-mini` com fallback Groq para o resumo
- Neon Postgres com `pg` + `attachDatabasePool` (`@vercel/functions`) e busca full-text em português
- Autenticação por senha única com cookie HMAC httpOnly

## Rodar localmente

```bash
cd web
cp .env.example .env.local
# preencha as variáveis
npm install
npm run dev
```

Execute `db/migrations/001_init.sql` no banco Neon antes do primeiro uso, usando a conexão direta (`DATABASE_URL_UNPOOLED`) — não a pooled.

## Variáveis de ambiente

| Variável | Uso |
|---|---|
| `BLOB_READ_WRITE_TOKEN` | Upload e remoção no Vercel Blob |
| `GROQ_API_KEY` | Transcrição principal |
| `OPENAI_API_KEY` | Fallback de transcrição e resumo |
| `DATABASE_URL` | Conexão com o Neon Postgres |
| `APP_PASSWORD` | Senha de acesso à aplicação |
| `AUTH_SECRET` | Segredo de assinatura da sessão |

## Deploy no Vercel

1. Crie o projeto apontando para o repositório com **Root Directory** `web`.
2. Adicione um Blob store e um banco Neon pelo marketplace.
3. Configure as variáveis de ambiente em Production.
4. Rode a migração no banco de produção.
5. Faça o deploy e teste com um áudio real.

## Scripts

```bash
npm run dev    # desenvolvimento
npm run build  # build de produção
npm run lint   # ESLint
npm run test   # Vitest
```

## Limites

- Áudio de até 5 minutos (300 s); acima disso a requisição é rejeitada.
- Arquivo de até 10 MB.
- Formatos: `.ogg`, `.opus`, `.mp3`, `.m4a`.
