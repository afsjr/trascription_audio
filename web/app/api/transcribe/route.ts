import { del } from "@vercel/blob";
import { NextResponse } from "next/server";
import {
  formatDuration,
  isAllowedAudio,
  isWithinDuration,
  MAX_DURATION_SECONDS,
  MAX_FILE_BYTES,
  readDurationSeconds,
} from "@/lib/audio";
import {
  createTranscriptRecord,
  findTranscriptByBlobUrl,
} from "@/lib/db";
import { messages } from "@/lib/messages";
import { logError, logEvent } from "@/lib/logger";
import { generateSummary, toSummaryText } from "@/lib/summary";
import { transcribeAudio } from "@/lib/transcription";

export const runtime = "nodejs";
export const maxDuration = 300;

type RequestBody = {
  blobUrl?: unknown;
  filename?: unknown;
  mimeType?: unknown;
  sizeBytes?: unknown;
  clientDurationSeconds?: unknown;
};

async function removeBlob(url: string): Promise<void> {
  try {
    await del(url);
  } catch (error) {
    logError("blob_delete_failed", error);
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as RequestBody | null;

  if (
    !body ||
    typeof body.blobUrl !== "string" ||
    typeof body.filename !== "string" ||
    typeof body.mimeType !== "string" ||
    typeof body.sizeBytes !== "number"
  ) {
    return NextResponse.json({ error: messages.badPayload }, { status: 400 });
  }

  const blobUrl = body.blobUrl;
  const filename = body.filename;
  const mimeType = body.mimeType;
  const sizeBytes = body.sizeBytes;

  if (!isAllowedAudio(filename, mimeType)) {
    return NextResponse.json(
      { error: messages.unsupportedFormat },
      { status: 415 },
    );
  }

  if (sizeBytes > MAX_FILE_BYTES) {
    await removeBlob(blobUrl);
    return NextResponse.json({ error: messages.fileTooLarge }, { status: 413 });
  }

  try {
    const existing = await findTranscriptByBlobUrl(blobUrl);
    if (existing) {
      return NextResponse.json({ error: messages.duplicate }, { status: 409 });
    }
  } catch (error) {
    logError("duplicate_check_failed", error);
  }

  let buffer: Uint8Array<ArrayBuffer>;
  try {
    const blobResponse = await fetch(blobUrl);
    if (!blobResponse.ok) {
      throw new Error(`Blob respondeu ${blobResponse.status}`);
    }
    buffer = new Uint8Array(await blobResponse.arrayBuffer());
  } catch (error) {
    logError("blob_fetch_failed", error);
    await removeBlob(blobUrl);
    return NextResponse.json(
      { error: messages.unreadableAudio },
      { status: 400 },
    );
  }

  const measuredDuration = await readDurationSeconds(buffer, mimeType);
  const clientDuration =
    typeof body.clientDurationSeconds === "number"
      ? body.clientDurationSeconds
      : null;
  const duration = measuredDuration ?? clientDuration;

  if (!isWithinDuration(duration)) {
    await removeBlob(blobUrl);
    logEvent("audio_rejected_duration", {
      duration: duration ?? null,
      limit: MAX_DURATION_SECONDS,
    });
    return NextResponse.json(
      { error: messages.durationTooLong },
      { status: 422 },
    );
  }

  try {
    const transcription = await transcribeAudio({
      buffer,
      filename,
      mimeType,
      fallbackDuration: duration,
    });

    const summaryResult = await generateSummary(transcription.text);
    const summaryText = toSummaryText(summaryResult.summary);

    const transcriptId = await createTranscriptRecord({
      blobUrl,
      filename,
      mimeType,
      sizeBytes,
      durationSeconds: transcription.durationSeconds ?? duration ?? 0,
      provider: transcription.provider,
      language: "pt",
      text: transcription.text,
      segments: transcription.segments,
      summary: summaryResult.summary,
      summaryModel: summaryResult.model,
      summaryText,
      tokensIn: summaryResult.tokensIn,
      tokensOut: summaryResult.tokensOut,
    });

    logEvent("transcription_done", {
      provider: transcription.provider,
      duration: transcription.durationSeconds ?? 0,
      chars: transcription.text.length,
      summaryFallback: summaryResult.fallback,
      summaryModel: summaryResult.model,
    });

    return NextResponse.json({
      transcriptId,
      text: transcription.text,
      segments: transcription.segments,
      durationLabel: formatDuration(transcription.durationSeconds ?? 0),
      summary: summaryResult.summary,
      summaryFallback: summaryResult.fallback,
    });
  } catch (error) {
    logError("transcription_failed", error);
    return NextResponse.json(
      { error: messages.transcriptionFailed },
      { status: 502 },
    );
  } finally {
    await removeBlob(blobUrl);
  }
}
