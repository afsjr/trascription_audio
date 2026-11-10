"use client";

import { upload } from "@vercel/blob/client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_SECONDS = 300;
const ALLOWED_EXTENSIONS = [".ogg", ".opus", ".mp3", ".m4a"];

type ResultItem = {
  filename: string;
  status: "ok" | "erro";
  message: string;
  transcriptId?: string;
};

function isAllowed(filename: string): boolean {
  const lower = filename.toLowerCase();
  return ALLOWED_EXTENSIONS.some((extension) => lower.endsWith(extension));
}

async function readDuration(file: File): Promise<number | null> {
  const url = URL.createObjectURL(file);
  try {
    const audio = document.createElement("audio");
    audio.preload = "metadata";
    audio.src = url;
    const duration = await new Promise<number>((resolve) => {
      const finish = (value: number) => resolve(value);
      audio.onloadedmetadata = () => finish(audio.duration);
      audio.onerror = () => finish(Number.NaN);
      window.setTimeout(() => finish(Number.NaN), 4000);
    });
    return Number.isFinite(duration) ? duration : null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function UploadForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ResultItem[]>([]);

  async function handleFiles(files: FileList) {
    setError(null);
    setResults([]);
    setBusy(true);

    const collected: ResultItem[] = [];

    for (const file of Array.from(files)) {
      try {
        if (!isAllowed(file.name)) {
          collected.push({
            filename: file.name,
            status: "erro",
            message: "Formato não suportado. Use .ogg, .opus, .mp3 ou .m4a.",
          });
          continue;
        }
        if (file.size > MAX_BYTES) {
          collected.push({
            filename: file.name,
            status: "erro",
            message: "Arquivo acima de 10 MB.",
          });
          continue;
        }

        const duration = await readDuration(file);
        if (duration !== null && duration > MAX_SECONDS + 0.5) {
          collected.push({
            filename: file.name,
            status: "erro",
            message: "Áudio acima de 5 minutos. Envie um áudio menor.",
          });
          continue;
        }

        const blob = await upload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/blob-upload",
        });

        const response = await fetch("/api/transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            blobUrl: blob.url,
            filename: file.name,
            mimeType: file.type || "audio/ogg",
            sizeBytes: file.size,
            clientDurationSeconds: duration,
          }),
        });

        const payload = (await response.json().catch(() => ({}))) as {
          transcriptId?: string;
          error?: string;
        };

        if (!response.ok) {
          collected.push({
            filename: file.name,
            status: "erro",
            message: payload.error ?? "Falha ao transcrever.",
          });
          continue;
        }

        collected.push({
          filename: file.name,
          status: "ok",
          message: "Transcrito com sucesso.",
          transcriptId: payload.transcriptId,
        });
      } catch {
        collected.push({
          filename: file.name,
          status: "erro",
          message: "Erro inesperado no envio. Tente novamente.",
        });
      }
    }

    setResults(collected);
    setBusy(false);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    router.refresh();
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold">Enviar áudio</h2>
      <p className="mt-1 text-sm text-slate-600">
        Arquivos .ogg, .opus, .mp3 ou .m4a, até 5 minutos e 10 MB. O áudio é
        apagado após a transcrição.
      </p>

      <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center transition hover:border-brand">
        <span className="text-sm font-medium text-slate-700">
          {busy ? "Processando..." : "Selecionar áudios"}
        </span>
        <span className="mt-1 text-xs text-slate-500">
          Aceita vários arquivos por vez
        </span>
        <input
          ref={inputRef}
          type="file"
          accept=".ogg,.opus,.mp3,.m4a,audio/*"
          multiple
          className="sr-only"
          disabled={busy}
          onChange={(event) => {
            if (event.target.files && event.target.files.length > 0) {
              void handleFiles(event.target.files);
            }
          }}
        />
      </label>

      {error ? (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      ) : null}

      {results.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {results.map((result) => (
            <li
              key={`${result.filename}-${result.message}`}
              className={`rounded-xl border px-3 py-2 text-sm ${
                result.status === "ok"
                  ? "border-teal-200 bg-teal-50 text-teal-900"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              <span className="font-medium">{result.filename}</span>:{" "}
              {result.transcriptId ? (
                <a
                  className="underline"
                  href={`/transcricao/${result.transcriptId}`}
                >
                  {result.message}
                </a>
              ) : (
                result.message
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
