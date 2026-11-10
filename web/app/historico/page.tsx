import Link from "next/link";
import { formatDuration } from "@/lib/audio";
import {
  listTranscripts,
  searchTranscripts,
  type SearchItem,
  type TranscriptListItem,
} from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HistoricoPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const page = Number(params.page ?? "1");

  let items: TranscriptListItem[] = [];
  let searchItems: SearchItem[] = [];
  let total = 0;
  let error: string | null = null;

  try {
    if (query) {
      searchItems = await searchTranscripts(query);
    } else {
      const result = await listTranscripts(Number.isFinite(page) ? page : 1);
      items = result.items;
      total = result.total;
    }
  } catch {
    error = "Não foi possível carregar o histórico.";
  }

  const currentPage = Number.isFinite(page) ? Math.max(1, page) : 1;
  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Histórico</h1>
        <p className="mt-1 text-sm text-slate-600">
          Busque por qualquer palavra do texto ou do resumo.
        </p>
      </div>

      <form action="/historico" method="get" className="flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Buscar no histórico"
          className="input"
          maxLength={200}
        />
        <button type="submit" className="btn-primary">
          Buscar
        </button>
      </form>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {query ? (
        searchItems.length === 0 ? (
          <p className="text-sm text-slate-500">
            Nenhum resultado. Tente um termo mais curto.
          </p>
        ) : (
          <ul className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {searchItems.map((item) => (
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
                      {new Date(item.createdAt).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <p
                    className="mark-highlight mt-1 text-xs text-slate-600"
                    dangerouslySetInnerHTML={{ __html: item.headline }}
                  />
                </Link>
              </li>
            ))}
          </ul>
        )
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhum áudio transcrito ainda.</p>
      ) : (
        <>
          <ul className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {items.map((item) => (
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

          {totalPages > 1 ? (
            <nav className="flex items-center justify-between text-sm">
              {currentPage > 1 ? (
                <Link
                  href={`/historico?page=${currentPage - 1}`}
                  className="btn-secondary"
                >
                  Anterior
                </Link>
              ) : (
                <span />
              )}
              <span className="text-slate-500">
                Página {currentPage} de {totalPages}
              </span>
              {currentPage < totalPages ? (
                <Link
                  href={`/historico?page=${currentPage + 1}`}
                  className="btn-secondary"
                >
                  Próxima
                </Link>
              ) : (
                <span />
              )}
            </nav>
          ) : null}
        </>
      )}
    </div>
  );
}
