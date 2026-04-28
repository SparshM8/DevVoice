import { ChatTurn } from "@/lib/types";

type Props = {
  turns: ChatTurn[];
};

export function TranscriptPanel({ turns }: Props) {
  return (
    <section className="glass rounded-xl p-5">
      <h2 className="text-lg font-semibold tracking-tight text-zinc-100">Live Transcript</h2>
      <div className="mt-4 max-h-[360px] space-y-3 overflow-auto pr-1">
        {turns.length === 0 ? (
          <p className="text-sm text-zinc-500">No transcript yet. Ask DevVoice a question.</p>
        ) : (
          turns.map((turn) => (
            <article
              key={turn.id}
              className={`rounded-lg border p-4 text-sm transition-colors ${
                turn.role === "user"
                  ? "border-zinc-800 bg-zinc-900/50 text-zinc-300"
                  : "border-zinc-700 bg-zinc-800/80 text-zinc-100 shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
              }`}
            >
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{turn.role}</p>
              <p className="whitespace-pre-wrap leading-relaxed">{turn.content}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
