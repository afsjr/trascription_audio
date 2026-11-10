import { NextResponse } from "next/server";
import { searchTranscripts } from "@/lib/db";
import { logError } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim();

  if (query.length === 0) {
    return NextResponse.json({ items: [] });
  }

  if (query.length > 200) {
    return NextResponse.json(
      { error: "Consulta acima de 200 caracteres" },
      { status: 400 },
    );
  }

  try {
    const items = await searchTranscripts(query);
    return NextResponse.json({ items });
  } catch (error) {
    logError("search_failed", error);
    return NextResponse.json(
      { error: "Falha na busca" },
      { status: 503 },
    );
  }
}
