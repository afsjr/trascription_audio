import { attachDatabasePool } from "@vercel/functions";
import { Pool, type PoolClient } from "pg";
import type { SummaryData } from "@/lib/summary-schema";

const globalForDb = globalThis as unknown as { pgPool?: Pool };

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL não configurada");
  }
  const pool = new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
  attachDatabasePool(pool);
  return pool;
}

export function getPool(): Pool {
  if (!globalForDb.pgPool) {
    globalForDb.pgPool = createPool();
  }
  return globalForDb.pgPool;
}

export type TranscriptListItem = {
  id: string;
  filename: string;
  durationSeconds: number;
  createdAt: string;
  summaryPreview: string;
};

export type TranscriptDetail = {
  id: string;
  filename: string;
  text: string;
  segments: Array<{ start: number; end: number; text: string }>;
  summary: SummaryData;
  provider: string;
  durationSeconds: number;
  createdAt: string;
};

export type SearchItem = {
  id: string;
  filename: string;
  createdAt: string;
  headline: string;
  rank: number;
};

type TranscriptRow = {
  id: string;
  filename: string;
  duration_seconds: string | number;
  created_at: string | Date;
  summary_text: string | null;
};

type DetailRow = {
  id: string;
  filename: string;
  text: string;
  segments: unknown;
  summary_json: unknown;
  provider: string;
  duration_seconds: string | number;
  created_at: string | Date;
};

function toIso(value: string | Date): string {
  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString();
}

function toNumber(value: string | number): number {
  return typeof value === "number" ? value : Number(value);
}

async function withTransaction<T>(
  work: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("begin");
    const result = await work(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export async function listTranscripts(page = 1): Promise<{
  items: TranscriptListItem[];
  total: number;
}> {
  const pool = getPool();
  const safePage = Math.max(1, Math.floor(page));
  const limit = 20;
  const offset = (safePage - 1) * limit;

  const rows = await pool.query<TranscriptRow>(
    `select t.id,
            u.original_filename as filename,
            t.duration_seconds,
            t.created_at,
            s.summary_text
     from transcripts t
     join uploads u on u.id = t.upload_id
     left join summaries s on s.transcript_id = t.id
     order by t.created_at desc
     limit $1 offset $2`,
    [limit, offset],
  );

  const countRows = await pool.query<{ count: number }>(
    "select count(*)::int as count from transcripts",
  );

  return {
    items: rows.rows.map((row) => ({
      id: row.id,
      filename: row.filename,
      durationSeconds: toNumber(row.duration_seconds),
      createdAt: toIso(row.created_at),
      summaryPreview: row.summary_text ?? "",
    })),
    total: countRows.rows[0]?.count ?? 0,
  };
}

export async function getTranscript(
  id: string,
): Promise<TranscriptDetail | null> {
  const rows = await getPool().query<DetailRow>(
    `select t.id,
            u.original_filename as filename,
            t.text,
            t.segments,
            s.summary_json,
            t.provider,
            t.duration_seconds,
            t.created_at
     from transcripts t
     join uploads u on u.id = t.upload_id
     left join summaries s on s.transcript_id = t.id
     where t.id = $1
     limit 1`,
    [id],
  );

  const row = rows.rows[0];
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    filename: row.filename,
    text: row.text,
    segments: Array.isArray(row.segments)
      ? (row.segments as Array<{ start: number; end: number; text: string }>)
      : [],
    summary: (row.summary_json ?? {
      temas: [],
      decisoes: [],
      acoes: [],
      pessoas: [],
      riscos: [],
      perguntasAbertas: [],
    }) as SummaryData,
    provider: row.provider,
    durationSeconds: toNumber(row.duration_seconds),
    createdAt: toIso(row.created_at),
  };
}

export async function searchTranscripts(query: string): Promise<SearchItem[]> {
  const rows = await getPool().query<{
    id: string;
    filename: string;
    created_at: string | Date;
    headline: string;
    rank: string | number;
  }>(
    `with consulta as (
       select websearch_to_tsquery('portuguese', $1) as q
     )
     select t.id,
            u.original_filename as filename,
            t.created_at,
            ts_headline(
              'portuguese',
              t.text,
              consulta.q,
              'StartSel=<mark>, StopSel=</mark>, MaxWords=30, MinWords=10'
            ) as headline,
            ts_rank(t.search_vector, consulta.q) as rank
     from transcripts t
     join uploads u on u.id = t.upload_id
     cross join consulta
     where t.search_vector @@ consulta.q
     order by rank desc
     limit 50`,
    [query],
  );

  return rows.rows.map((row) => ({
    id: row.id,
    filename: row.filename,
    createdAt: toIso(row.created_at),
    headline: row.headline,
    rank: toNumber(row.rank),
  }));
}

export async function createTranscriptRecord(input: {
  blobUrl: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  durationSeconds: number;
  provider: string;
  language: string;
  text: string;
  segments: Array<{ start: number; end: number; text: string }>;
  summary: SummaryData;
  summaryModel: string;
  summaryText: string;
  tokensIn: number;
  tokensOut: number;
}): Promise<string> {
  return withTransaction(async (client) => {
    const uploadRows = await client.query<{ id: string }>(
      `insert into uploads
         (blob_url, original_filename, mime_type, size_bytes, duration_seconds, status)
       values ($1, $2, $3, $4, $5, 'transcribing')
       returning id`,
      [
        input.blobUrl,
        input.filename,
        input.mimeType,
        input.sizeBytes,
        input.durationSeconds,
      ],
    );
    const uploadId = uploadRows.rows[0].id;

    const transcriptRows = await client.query<{ id: string }>(
      `insert into transcripts
         (upload_id, provider, language, text, segments, duration_seconds)
       values ($1, $2, $3, $4, $5::jsonb, $6)
       returning id`,
      [
        uploadId,
        input.provider,
        input.language,
        input.text,
        JSON.stringify(input.segments),
        input.durationSeconds,
      ],
    );
    const transcriptId = transcriptRows.rows[0].id;

    await client.query(
      `insert into summaries
         (transcript_id, model, summary_json, summary_text, tokens_in, tokens_out)
       values ($1, $2, $3::jsonb, $4, $5, $6)`,
      [
        transcriptId,
        input.summaryModel,
        JSON.stringify(input.summary),
        input.summaryText,
        input.tokensIn,
        input.tokensOut,
      ],
    );

    await client.query("update uploads set status = 'done' where id = $1", [
      uploadId,
    ]);

    return transcriptId;
  });
}

export async function findTranscriptByBlobUrl(
  blobUrl: string,
): Promise<string | null> {
  const rows = await getPool().query<{ id: string }>(
    `select t.id
     from transcripts t
     join uploads u on u.id = t.upload_id
     where u.blob_url = $1
     limit 1`,
    [blobUrl],
  );
  return rows.rows[0]?.id ?? null;
}

export async function deleteTranscript(id: string): Promise<boolean> {
  return withTransaction(async (client) => {
    const uploads = await client.query<{ id: string }>(
      `delete from uploads
       where id = (select upload_id from transcripts where id = $1)
       returning id`,
      [id],
    );
    if ((uploads.rowCount ?? 0) > 0) {
      return true;
    }
    const direct = await client.query<{ id: string }>(
      "delete from transcripts where id = $1 returning id",
      [id],
    );
    return (direct.rowCount ?? 0) > 0;
  });
}

export async function removeUploadByBlobUrl(blobUrl: string): Promise<void> {
  await getPool().query("delete from uploads where blob_url = $1", [blobUrl]);
}

export async function isLoginBlocked(ipHash: string): Promise<boolean> {
  try {
    const rows = await getPool().query<{
      blocked_until: string | Date | null;
    }>("select blocked_until from access_attempts where ip_hash = $1", [ipHash]);
    const blockedUntil = rows.rows[0]?.blocked_until;
    if (!blockedUntil) {
      return false;
    }
    return new Date(blockedUntil).getTime() > Date.now();
  } catch {
    return false;
  }
}

export async function registerLoginFailure(ipHash: string): Promise<void> {
  try {
    await getPool().query(
      `insert into access_attempts (ip_hash, failed_count, updated_at)
       values ($1, 1, now())
       on conflict (ip_hash) do update set
         failed_count = access_attempts.failed_count + 1,
         blocked_until = case
           when access_attempts.failed_count + 1 >= 5 then now() + interval '15 minutes'
           else access_attempts.blocked_until
         end,
         updated_at = now()`,
      [ipHash],
    );
  } catch {
    return;
  }
}

export async function clearLoginFailures(ipHash: string): Promise<void> {
  try {
    await getPool().query("delete from access_attempts where ip_hash = $1", [
      ipHash,
    ]);
  } catch {
    return;
  }
}
