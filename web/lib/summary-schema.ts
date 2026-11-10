import { z } from "zod";

const stringList = z.array(z.string().trim().min(1)).default([]);

export const SummarySchema = z.object({
  temas: stringList,
  decisoes: stringList,
  acoes: stringList,
  pessoas: stringList,
  riscos: stringList,
  perguntasAbertas: stringList,
});

export type SummaryData = z.infer<typeof SummarySchema>;

export const EMPTY_SUMMARY: SummaryData = {
  temas: [],
  decisoes: [],
  acoes: [],
  pessoas: [],
  riscos: [],
  perguntasAbertas: [],
};

export function toSummaryText(summary: SummaryData): string {
  const sections: Array<[string, string[]]> = [
    ["Temas", summary.temas],
    ["Decisões", summary.decisoes],
    ["Ações", summary.acoes],
    ["Pessoas", summary.pessoas],
    ["Riscos", summary.riscos],
    ["Perguntas abertas", summary.perguntasAbertas],
  ];
  return sections
    .filter(([, items]) => items.length > 0)
    .map(([title, items]) => `${title}: ${items.join("; ")}`)
    .join("\n");
}

export function summaryPreview(summary: SummaryData, maxLength = 160): string {
  const text = toSummaryText(summary).replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 1)}…`;
}

export function buildSummaryPrompt(transcript: string): string {
  return [
    "Você resume transcrições de áudios de WhatsApp em português do Brasil.",
    "Responda SOMENTE com um objeto JSON válido, sem markdown, com as chaves:",
    '"temas" (array de string), "decisoes" (array), "acoes" (array),',
    '"pessoas" (array), "riscos" (array), "perguntasAbertas" (array).',
    "Use frases curtas. Não invente informação que não esteja na transcrição.",
    "Se um bloco não tiver conteúdo, use um array vazio.",
    "Limite o total do resumo a 400 palavras.",
    "",
    "Transcrição:",
    transcript,
  ].join("\n");
}
