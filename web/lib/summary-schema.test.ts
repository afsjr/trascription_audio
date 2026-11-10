import { describe, expect, it } from "vitest";
import {
  EMPTY_SUMMARY,
  SummarySchema,
  summaryPreview,
  toSummaryText,
} from "@/lib/summary-schema";

const valid = {
  temas: ["Orçamento do projeto"],
  decisoes: ["Aprovar o valor de 10 mil"],
  acoes: ["Enviar a proposta até sexta"],
  pessoas: ["Maria"],
  riscos: [],
  perguntasAbertas: ["Qual o prazo final?"],
};

describe("schema de resumo", () => {
  it("aceita o resumo completo", () => {
    const result = SummarySchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("preenche blocos ausentes com arrays vazios", () => {
    const result = SummarySchema.safeParse({ temas: ["A"] });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.decisoes).toEqual([]);
      expect(result.data.perguntasAbertas).toEqual([]);
    }
  });

  it("rejeita tipo errado", () => {
    const result = SummarySchema.safeParse({ temas: "não é array" });
    expect(result.success).toBe(false);
  });

  it("monta o texto legível", () => {
    const text = toSummaryText(valid);
    expect(text).toContain("Temas: Orçamento do projeto");
    expect(text).toContain("Ações: Enviar a proposta até sexta");
    expect(text).not.toContain("Riscos");
  });

  it("gera prévia curta", () => {
    const preview = summaryPreview(valid, 30);
    expect(preview.length).toBeLessThanOrEqual(30);
  });

  it("resumo vazio não gera texto", () => {
    expect(toSummaryText(EMPTY_SUMMARY)).toBe("");
  });
});
