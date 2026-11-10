export const MAX_DURATION_SECONDS = 300;

export type TranscriptSegment = {
  start: number;
  end: number;
  text: string;
};

export type TranscriptionResult = {
  text: string;
  segments: TranscriptSegment[];
  provider: "groq" | "openai";
  durationSeconds: number | null;
};

const GROQ_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
const OPENAI_URL = "https://api.openai.com/v1/audio/transcriptions";

const GROQ_MODEL = process.env.GROQ_TRANSCRIBE_MODEL ?? "whisper-large-v3-turbo";
const OPENAI_MODEL =
  process.env.OPENAI_TRANSCRIBE_MODEL ?? "whisper-1";

type RawSegment = {
  start?: number;
  end?: number;
  text?: string;
};

type RawTranscription = {
  text?: string;
  duration?: number;
  segments?: RawSegment[];
};

async function postTranscription(
  url: string,
  apiKey: string,
  model: string,
  blob: Blob,
  filename: string,
): Promise<RawTranscription> {
  const form = new FormData();
  form.append("file", blob, filename);
  form.append("model", model);
  form.append("language", "pt");
  form.append("response_format", "verbose_json");
  form.append("timestamp_granularities[]", "segment");

  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
    signal: AbortSignal.timeout(120_000),
  });

  if (!response.ok) {
    throw new Error(`Transcrição respondeu ${response.status}`);
  }

  return (await response.json()) as RawTranscription;
}

function normalizeSegments(
  segments: RawSegment[] | undefined,
  duration: number | null,
): TranscriptSegment[] {
  if (!segments || segments.length === 0) {
    return duration && duration > 0
      ? [{ start: 0, end: duration, text: "" }]
      : [];
  }
  return segments
    .map((segment) => ({
      start: typeof segment.start === "number" ? segment.start : 0,
      end:
        typeof segment.end === "number"
          ? segment.end
          : typeof segment.start === "number"
            ? segment.start
            : 0,
      text: (segment.text ?? "").trim(),
    }))
    .filter((segment) => segment.text.length > 0);
}

export async function transcribeAudio(input: {
  buffer: Uint8Array<ArrayBuffer>;
  filename: string;
  mimeType: string;
  fallbackDuration: number | null;
}): Promise<TranscriptionResult> {
  const blob = new Blob([input.buffer], { type: input.mimeType || "audio/ogg" });

  const providers: Array<{
    name: "groq" | "openai";
    url: string;
    key: string | undefined;
    model: string;
  }> = [
    { name: "groq", url: GROQ_URL, key: process.env.GROQ_API_KEY, model: GROQ_MODEL },
    {
      name: "openai",
      url: OPENAI_URL,
      key: process.env.OPENAI_API_KEY,
      model: OPENAI_MODEL,
    },
  ];

  const preferred =
    providers.find((provider) => provider.key !== undefined) ??
    providers[0];
  const ordered = [preferred, ...providers.filter((p) => p !== preferred)];

  let lastError: unknown = null;

  for (const provider of ordered) {
    if (!provider.key) {
      continue;
    }
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const raw = await postTranscription(
          provider.url,
          provider.key,
          provider.model,
          blob,
          input.filename,
        );
        const duration =
          typeof raw.duration === "number" ? raw.duration : input.fallbackDuration;
        return {
          text: (raw.text ?? "").trim(),
          segments: normalizeSegments(raw.segments, duration),
          provider: provider.name,
          durationSeconds: duration,
        };
      } catch (error) {
        lastError = error;
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Falha ao transcrever o áudio");
}
