import type { SummaryData } from "@/lib/summary-schema";

const BLOCKS: Array<[keyof SummaryData, string]> = [
  ["temas", "Temas"],
  ["decisoes", "Decisões"],
  ["acoes", "Ações"],
  ["pessoas", "Pessoas"],
  ["riscos", "Riscos"],
  ["perguntasAbertas", "Perguntas abertas"],
];

export function SummaryView({ summary }: { summary: SummaryData }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {BLOCKS.map(([key, title]) => {
        const items = summary[key] ?? [];
        return (
          <section key={key} className="card">
            <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
            {items.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">Nada identificado.</p>
            ) : (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {items.map((item, index) => (
                  <li key={`${key}-${index}`}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
