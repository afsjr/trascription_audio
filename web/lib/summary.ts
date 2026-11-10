import {
  EMPTY_SUMMARY,
  SummaryData,
  SummarySchema,
  buildSummaryPrompt,
  toSummaryText,
} from "@/lib/summary-schema";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";

const OPENAI_MODEL = process.env.OPENAI_SUMMARY_MODEL ?? "gpt-4o-mini";
const GROQ_MODEL = process.env.GROQ_SUMMARY_MODEL ?? "llama-3.3-70b-versatile";

export type SummaryResult = {
  summary: SummaryData;
  model: string;
  tokensIn: number;
  tokensOut: number;
  fallback: boolean;
};

type ProviderResult = {
  content: string;
  model: string;
  tokensIn: number;
  tokensOut: number;
};

async function callOpenAi(prompt: string): Promise<ProviderResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY ausente");
  }
  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Você é um assistente que resume áudios em português do Brasil e responde apenas JSON.",
        },
        { role: "user", content: prompt },
      ],
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok) {
    throw new Error(`OpenAI respondeu ${response.status}`);
  }
  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI sem conteúdo");
  }
  return {
    content,
    model: OPENAI_MODEL,
    tokensIn: data.usage?.prompt_tokens ?? 0,
    tokensOut: data.usage?.completion_tokens ?? 0,
  };
}

async function callGroq(prompt: string): Promise<ProviderResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY ausente");
  }
  const response = await fetch(GROQ_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Você é um assistente que resume áudios em português do Brasil e responde apenas JSON.",
        },
        { role: "user", content: prompt },
      ],
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok) {
    throw new Error(`Groq respondeu ${response.status}`);
  }
  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Groq sem conteúdo");
  }
  return {
    content,
    model: GROQ_MODEL,
    tokensIn: data.usage?.prompt_tokens ?? 0,
    tokensOut: data.usage?.completion_tokens ?? 0,
  };
}

function parseSummary(content: string): SummaryData | null {
  try {
    const parsed = JSON.parse(content);
    const result = SummarySchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

async function requestWithProvider(
  provider: "openai" | "groq",
  prompt: string,
): Promise<ProviderResult> {
  return provider === "openai" ? callOpenAi(prompt) : callGroq(prompt);
}

export async function generateSummary(transcript: string): Promise<SummaryResult> {
  const trimmed = transcript.trim();
  if (!trimmed) {
    return {
      summary: EMPTY_SUMMARY,
      model: "none",
      tokensIn: 0,
      tokensOut: 0,
      fallback: false,
    };
  }

  const prompt = buildSummaryPrompt(trimmed);
  const primary: "openai" | "groq" = process.env.OPENAI_API_KEY
    ? "openai"
    : "groq";
  const secondary: "openai" | "groq" = primary === "openai" ? "groq" : "openai";

  for (const provider of [primary, secondary]) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const correction =
          attempt === 0
            ? prompt
            : `${prompt}\n\nA resposta anterior não era JSON válido. Responda apenas o objeto JSON.`;
        const result = await requestWithProvider(provider, correction);
        const summary = parseSummary(result.content);
        if (summary) {
          return {
            summary,
            model: result.model,
            tokensIn: result.tokensIn,
            tokensOut: result.tokensOut,
            fallback: provider !== primary,
          };
        }
      } catch {
        break;
      }
    }
  }

  return {
    summary: EMPTY_SUMMARY,
    model: "minimo",
    tokensIn: 0,
    tokensOut: 0,
    fallback: true,
  };
}

export { toSummaryText };
