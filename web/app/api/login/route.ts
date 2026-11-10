import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  checkPassword,
  createSessionToken,
  hashIp,
  sessionCookieOptions,
} from "@/lib/auth";
import {
  clearLoginFailures,
  isLoginBlocked,
  registerLoginFailure,
} from "@/lib/db";
import { logEvent, logError } from "@/lib/logger";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!process.env.APP_PASSWORD || !process.env.AUTH_SECRET) {
    return NextResponse.json(
      { error: "Aplicação sem senha configurada" },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { password?: unknown }
    | null;

  if (!body || typeof body.password !== "string") {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }

  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "local";
  const ipHash = await hashIp(ip);

  try {
    if (await isLoginBlocked(ipHash)) {
      return NextResponse.json(
        { error: "Muitas tentativas. Tente em 15 minutos." },
        { status: 429 },
      );
    }
  } catch (error) {
    logError("login_block_check_failed", error);
  }

  if (!checkPassword(body.password)) {
    await registerLoginFailure(ipHash);
    logEvent("login_failed", { ipHash });
    return NextResponse.json({ error: "Senha incorreta" }, { status: 401 });
  }

  await clearLoginFailures(ipHash);
  const token = await createSessionToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  logEvent("login_success", { ipHash });
  return response;
}
