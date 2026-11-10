# Data Delta: Transcrição de áudios do WhatsApp

> Identificador: `001-transcricao-whatsapp`
> Data: `2026-11-10`

## 1. Contexto

🟡 Projeto greenfield. Não há modelo extraído em `_reversa_sdd/`; este documento descreve o modelo inicial criado pela feature.

## 2. Tabelas novas

### uploads

| Campo | Tipo | Restrições | Descrição |
|-------|------|------------|-----------|
| id | uuid | pk, default gen_random_uuid() | Identificador do envio |
| blob_url | text | not null | URL do arquivo no Vercel Blob |
| original_filename | text | not null | Nome original do arquivo |
| mime_type | text | not null | Tipo MIME |
| size_bytes | integer | not null | Tamanho em bytes |
| duration_seconds | numeric(8,2) | not null | Duração validada |
| status | text | not null, default 'pending' | pending, transcribing, done, failed |
| created_at | timestamptz | not null, default now() | Data de criação |

### transcripts

| Campo | Tipo | Restrições | Descrição |
|-------|------|------------|-----------|
| id | uuid | pk, default gen_random_uuid() | Identificador da transcrição |
| upload_id | uuid | fk uploads(id), on delete cascade | Envio de origem |
| provider | text | not null | groq ou openai |
| language | text | not null, default 'pt' | Idioma |
| text | text | not null | Texto completo |
| segments | jsonb | not null, default '[]' | Lista de segmentos |
| duration_seconds | numeric(8,2) | not null | Duração informada pela API |
| search_vector | tsvector | generated always as (to_tsvector('portuguese', coalesce(text,''))) stored | Índice de busca |
| created_at | timestamptz | not null, default now() | Data de criação |

### summaries

| Campo | Tipo | Restrições | Descrição |
|-------|------|------------|-----------|
| id | uuid | pk, default gen_random_uuid() | Identificador do resumo |
| transcript_id | uuid | fk transcripts(id), on delete cascade, unique | Transcrição de origem |
| model | text | not null | Modelo usado |
| summary_json | jsonb | not null | Seis blocos estruturados |
| summary_text | text | not null | Versão legível para busca |
| tokens_in | integer | | Tokens de entrada |
| tokens_out | integer | | Tokens de saída |
| created_at | timestamptz | not null, default now() | Data de criação |

### access_attempts

| Campo | Tipo | Restrições | Descrição |
|-------|------|------------|-----------|
| ip_hash | text | pk | Hash do IP |
| failed_count | integer | not null, default 0 | Tentativas falhas |
| blocked_until | timestamptz | | Fim do bloqueio |
| updated_at | timestamptz | not null, default now() | Última atualização |

## 3. Índices

- 🟡 `create index transcripts_search_idx on transcripts using gin (search_vector);`
- 🟡 `create index transcripts_created_idx on transcripts (created_at desc);`
- 🟡 `create index uploads_status_idx on uploads (status);`

## 4. Migrações necessárias

🟡 Sim. Script único de criação em `web/db/migrations/001_init.sql`, idempotente com `if not exists`.
