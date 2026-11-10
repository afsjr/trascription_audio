import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { MAX_FILE_BYTES } from "@/lib/audio";
import { logError } from "@/lib/logger";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [
          "audio/ogg",
          "audio/opus",
          "audio/mpeg",
          "audio/mp3",
          "audio/mp4",
          "audio/x-m4a",
          "audio/m4a",
        ],
        maximumSizeInBytes: MAX_FILE_BYTES,
        addRandomSuffix: true,
      }),
      onUploadCompleted: async () => {
        return;
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    logError("blob_upload_token_failed", error);
    return NextResponse.json(
      { error: "Falha ao autorizar o upload" },
      { status: 400 },
    );
  }
}
