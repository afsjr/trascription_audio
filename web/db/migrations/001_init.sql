create extension if not exists "pgcrypto";

create table if not exists uploads (
  id uuid primary key default gen_random_uuid(),
  blob_url text not null unique,
  original_filename text not null,
  mime_type text not null,
  size_bytes integer not null,
  duration_seconds numeric(8, 2) not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists uploads_status_idx on uploads (status);

create table if not exists transcripts (
  id uuid primary key default gen_random_uuid(),
  upload_id uuid not null references uploads (id) on delete cascade,
  provider text not null,
  language text not null default 'pt',
  text text not null,
  segments jsonb not null default '[]'::jsonb,
  duration_seconds numeric(8, 2) not null,
  search_vector tsvector generated always as (
    to_tsvector('portuguese', coalesce(text, ''))
  ) stored,
  created_at timestamptz not null default now()
);

create index if not exists transcripts_search_idx on transcripts using gin (search_vector);
create index if not exists transcripts_created_idx on transcripts (created_at desc);
create index if not exists transcripts_upload_idx on transcripts (upload_id);

create table if not exists summaries (
  id uuid primary key default gen_random_uuid(),
  transcript_id uuid not null unique references transcripts (id) on delete cascade,
  model text not null,
  summary_json jsonb not null,
  summary_text text not null,
  tokens_in integer,
  tokens_out integer,
  created_at timestamptz not null default now()
);

create index if not exists summaries_transcript_idx on summaries (transcript_id);

create table if not exists access_attempts (
  ip_hash text primary key,
  failed_count integer not null default 0,
  blocked_until timestamptz,
  updated_at timestamptz not null default now()
);
