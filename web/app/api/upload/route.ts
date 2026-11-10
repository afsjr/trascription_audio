import { del, put } from "@vercel/blob";
import { NextResponse } from "next/server";
import {
  formatDuration,
  isAllowedAudio,
  isWithinDuration,
  MAX_DURATION_SECONDS,
  MAX_FILE_BYTES,
  readDurationSeconds,
} from "@/lib/audio";
import { createTranscriptRecord } from "@/lib/db";
import { messages } from "@/lib/messages";
import { logError, logEvent } from "@/lib/logger";
import { generateSummary, toSummaryText } from "@/lib/summary";
import { transcribeAudio } from "@/lib/transcription";

export const runtime = "nodejs";
export const maxDuration = 300;

async function removeBlob(url: string): Promise<void> {
  try {
    await del(url);
  } catch (error) {
    logError("blob_delete_failed", error);
  }
}

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: messages.badPayload }, { status: 400 });
  }

  const file = form.get("file");
  if (
    !file ||
    typeof file === "string" ||
    typeof (file as Blob).arrayBuffer !== "function"
  ) {
    return NextResponse.json({ error: messages.badPayload }, { status: 400 });
  }

  const upload = file as File;
  const filename = upload.name || "audio";
  const mimeType = upload.type || "audio/ogg";
  const sizeBytes = upload.size;

  if (!isAllowedAudio(filename, mimeType)) {
    return NextResponse.json(
      { error: messages.unsupportedFormat },
      { status: 415 },
    );
  }

  if (sizeBytes > MAX_FILE_BYTES) {
    return NextResponse.json({ error: messages.fileTooLarge }, { status: 413 });
  }

  const buffer = new Uint8Array(await upload.arrayBuffer());
  const measuredDuration = await readDurationSeconds(buffer, mimeType);
  const rawClientDuration = Number(form.get("clientDurationSeconds"));
  const clientDuration = Number.isFinite(rawClientDuration)
    ? rawClientDuration
    : null;
  const duration = measuredDuration ?? clientDuration;

  if (!isWithinDuration(duration)) {
    logEvent("audio_rejected_duration", {
      duration: duration ?? null,
      limit: MAX_DURATION_SECONDS,
    });
    return NextResponse.json(
      { error: messages.durationTooLong },
      { status: 422 },
    );
  }

  let blobUrl: string | null = null;

  try {
    const blob = await put(
      filename,
      new Blob([buffer], { type: mimeType }),
      { access: "private", addRandomSuffix: true },
    );
    blobUrl = blob.url;

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
    logError("upload_pipeline_failed", error);
    return NextResponse.json(
      { error: messages.transcriptionFailed },
      { status: 502 },
    );
  } finally {
    if (blobUrl) {
      await removeBlob(blobUrl);
    }
  }
}
