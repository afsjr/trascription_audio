import { NextResponse } from "next/server";
import { listTranscripts } from "@/lib/db";
import { logError } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pageParam = Number(searchParams.get("page") ?? "1");
  const page = Number.isFinite(pageParam) ? pageParam : 1;

  try {
    const result = await listTranscripts(page);
    return NextResponse.json({
      items: result.items,
      total: result.total,
      page,
      pageSize: 20,
    });
  } catch (error) {
    logError("list_transcripts_failed", error);
    return NextResponse.json(
      { error: "Falha ao carregar o histórico" },
      { status: 503 },
    );
  }
}
