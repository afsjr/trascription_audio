import Link from "next/link";
import { UploadForm } from "@/components/upload-form";
import { listTranscripts, type TranscriptListItem } from "@/lib/db";
import { formatDuration } from "@/lib/audio";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let recent: TranscriptListItem[] = [];
  let dbError = false;

  try {
    const result = await listTranscripts(1);
    recent = result.items.slice(0, 5);
  } catch {
    dbError = true;
  }

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">
          Transcreva, resuma e busque áudios do WhatsApp
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Envie um áudio de até 5 minutos, receba a transcrição com timestamps
          e um resumo detalhado. O histórico fica pesquisável e o áudio é
          apagado após o processamento.
        </p>
      </section>

      <UploadForm />

      {dbError ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Não foi possível carregar o histórico. Verifique a conexão com o banco.
        </p>
      ) : null}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Últimos áudios</h2>
          <Link href="/historico" className="text-sm text-brand underline">
            Ver histórico
          </Link>
        </div>

        {recent.length === 0 ? (
          <p className="text-sm text-slate-500">
            Nenhum áudio transcrito ainda.
          </p>
        ) : (
          <ul className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {recent.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/transcricao/${item.id}`}
                  className="block px-4 py-3 transition hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-medium">
                      {item.filename}
                    </span>
                    <span className="shrink-0 text-xs text-slate-500">
                      {formatDuration(item.durationSeconds)} ·{" "}
                      {new Date(item.createdAt).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  {item.summaryPreview ? (
                    <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                      {item.summaryPreview}
                    </p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
