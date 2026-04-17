import { RetrievedChunk } from "@/lib/types";

type Props = {
  chunks: RetrievedChunk[];
};

export function ContextCards({ chunks }: Props) {
  return (
    <section className="glass rounded-2xl p-5">
      <h2 className="text-lg font-semibold text-white">Retrieved Context</h2>
      <div className="mt-4 space-y-3">
        {chunks.length === 0 ? (
          <p className="text-sm text-slate-400">No context retrieved yet. Upload docs or seed data.</p>
        ) : (
          chunks.map((chunk) => (
            <article key={chunk.id} className="rounded-xl border border-ink-700 bg-ink-900/70 p-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{chunk.source}</span>
                <span>score {chunk.score.toFixed(3)}</span>
              </div>
              <p className="mt-2 line-clamp-4 text-sm text-slate-200">{chunk.text}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
