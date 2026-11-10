import { NextResponse } from "next/server";
import { deleteTranscript, getTranscript } from "@/lib/db";
import { messages } from "@/lib/messages";
import { logError } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  try {
    const transcript = await getTranscript(id);
    if (!transcript) {
      return NextResponse.json({ error: messages.notFound }, { status: 404 });
    }
    return NextResponse.json(transcript);
  } catch (error) {
    logError("get_transcript_failed", error);
    return NextResponse.json({ error: messages.serverError }, { status: 503 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  try {
    const deleted = await deleteTranscript(id);
    if (!deleted) {
      return NextResponse.json({ error: messages.notFound }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    logError("delete_transcript_failed", error);
    return NextResponse.json({ error: messages.serverError }, { status: 503 });
  }
}
