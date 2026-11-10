import { describe, expect, it } from "vitest";
import {
  formatDuration,
  isAllowedAudio,
  isWithinDuration,
  MAX_DURATION_SECONDS,
} from "@/lib/audio";

describe("validação de áudio", () => {
  it("aceita as extensões do WhatsApp", () => {
    expect(isAllowedAudio("audio.ogg", "audio/ogg")).toBe(true);
    expect(isAllowedAudio("audio.opus", "audio/opus")).toBe(true);
    expect(isAllowedAudio("audio.mp3", "audio/mpeg")).toBe(true);
    expect(isAllowedAudio("audio.m4a", "audio/mp4")).toBe(true);
  });

  it("rejeita formatos fora da lista", () => {
    expect(isAllowedAudio("video.mp4", "video/mp4")).toBe(false);
    expect(isAllowedAudio("documento.pdf", "application/pdf")).toBe(false);
  });

  it("aceita duração até o limite", () => {
    expect(isWithinDuration(300)).toBe(true);
    expect(isWithinDuration(300.4)).toBe(true);
  });

  it("rejeita duração acima do limite", () => {
    expect(isWithinDuration(MAX_DURATION_SECONDS + 5)).toBe(false);
  });

  it("permite duração desconhecida para validar no servidor", () => {
    expect(isWithinDuration(null)).toBe(true);
  });

  it("formata segundos como minutos e segundos", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(65)).toBe("1:05");
    expect(formatDuration(300)).toBe("5:00");
  });
});
