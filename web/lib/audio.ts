import { parseBuffer } from "music-metadata";

export const MAX_DURATION_SECONDS = 300;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

export const ALLOWED_MIME_TYPES = [
  "audio/ogg",
  "audio/opus",
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/x-m4a",
  "audio/m4a",
];

export const ALLOWED_EXTENSIONS = [".ogg", ".opus", ".mp3", ".m4a"];

export function isAllowedAudio(filename: string, mimeType: string): boolean {
  const lower = filename.toLowerCase();
  const byExtension = ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
  const byMime =
    ALLOWED_MIME_TYPES.includes(mimeType) ||
    mimeType.startsWith("audio/");
  return byExtension || byMime;
}

export function isWithinDuration(durationSeconds: number | null): boolean {
  if (durationSeconds === null) {
    return true;
  }
  return durationSeconds <= MAX_DURATION_SECONDS + 0.5;
}

export async function readDurationSeconds(
  data: Uint8Array,
  mimeType?: string,
): Promise<number | null> {
  try {
    const metadata = await parseBuffer(data, mimeType, { duration: true });
    const duration = metadata.format.duration;
    if (typeof duration !== "number" || Number.isNaN(duration)) {
      return null;
    }
    return duration;
  } catch {
    return null;
  }
}

export function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
