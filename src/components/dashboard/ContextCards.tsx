import { RetrievedChunk } from "@/lib/types";

type Props = {
  chunks: RetrievedChunk[];
};

export function ContextCards({ chunks }: Props) {
  return (
    <section className="glass rounded-xl p-5">
      <h2 className="text-lg font-semibold tracking-tight text-zinc-100">Retrieved Context</h2>
      <div className="mt-4 space-y-3">
        {chunks.length === 0 ? (
          <p className="text-sm text-zinc-500">No context retrieved yet. Upload docs or seed data.</p>
        ) : (
          chunks.map((chunk) => (
            <article key={chunk.id} className="rounded-lg border border-ink-800 bg-ink-900 p-4 transition hover:border-zinc-600 hover:bg-zinc-800/50">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                <span className="truncate">{chunk.source}</span>
                <span className="shrink-0 text-neon-mint">score {chunk.score.toFixed(3)}</span>
              </div>
              <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-zinc-300">{chunk.text}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
