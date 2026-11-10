import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/delete-button";
import { SummaryView } from "@/components/summary-view";
import { formatDuration } from "@/lib/audio";
import { getTranscript } from "@/lib/db";

export const dynamic = "force-dynamic";

function formatTimestamp(seconds: number): string {
  return formatDuration(seconds);
}

export default async function TranscriptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let transcript;
  try {
    transcript = await getTranscript(id);
  } catch {
    return (
      <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        Não foi possível carregar a transcrição.
      </p>
    );
  }

  if (!transcript) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/historico" className="text-sm text-brand underline">
            Voltar ao histórico
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            {transcript.filename}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {formatDuration(transcript.durationSeconds)} ·{" "}
            {new Date(transcript.createdAt).toLocaleString("pt-BR")} ·
            provedor {transcript.provider}
          </p>
        </div>
        <DeleteButton id={transcript.id} />
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Resumo detalhado</h2>
        <SummaryView summary={transcript.summary} />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Transcrição</h2>

        {transcript.segments.length > 0 ? (
          <ol className="space-y-2">
            {transcript.segments.map((segment, index) => (
              <li
                key={`${segment.start}-${index}`}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <span className="mr-3 font-mono text-xs text-slate-500">
                  {formatTimestamp(segment.start)}
                </span>
                {segment.text}
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-slate-500">Sem fala detectada.</p>
        )}

        <details className="card">
          <summary className="cursor-pointer text-sm font-semibold">
            Texto completo
          </summary>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
            {transcript.text || "Sem fala detectada."}
          </p>
        </details>
      </section>
    </div>
  );
}
