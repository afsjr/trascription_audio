import { beforeAll, describe, expect, it } from "vitest";
import {
  checkPassword,
  constantTimeEqual,
  createSessionToken,
  verifySessionToken,
} from "@/lib/auth";

describe("sessão", () => {
  beforeAll(() => {
    process.env.AUTH_SECRET = "segredo-de-teste-com-32-bytes!!";
    process.env.APP_PASSWORD = "senha-correta";
  });

  it("assina e verifica um token válido", async () => {
    const token = await createSessionToken();
    expect(await verifySessionToken(token)).toBe(true);
  });

  it("rejeita token adulterado", async () => {
    const token = await createSessionToken();
    const tampered = `${token.slice(0, -1)}x`;
    expect(await verifySessionToken(tampered)).toBe(false);
  });

  it("rejeita token expirado", async () => {
    const token = await createSessionToken(-1);
    expect(await verifySessionToken(token)).toBe(false);
  });

  it("rejeita token ausente", async () => {
    expect(await verifySessionToken(undefined)).toBe(false);
  });

  it("compara senhas em tempo constante", () => {
    expect(constantTimeEqual("abc", "abc")).toBe(true);
    expect(constantTimeEqual("abc", "abd")).toBe(false);
    expect(constantTimeEqual("abc", "abcd")).toBe(false);
  });

  it("valida a senha configurada", () => {
    expect(checkPassword("senha-correta")).toBe(true);
    expect(checkPassword("senha-errada")).toBe(false);
  });
});
