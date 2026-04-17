import { ChatTurn } from "@/lib/types";

type Props = {
  turns: ChatTurn[];
};

export function TranscriptPanel({ turns }: Props) {
  return (
    <section className="glass rounded-2xl p-5">
      <h2 className="text-lg font-semibold text-white">Live Transcript</h2>
      <div className="mt-4 max-h-[360px] space-y-3 overflow-auto pr-1">
        {turns.length === 0 ? (
          <p className="text-sm text-slate-400">No transcript yet. Ask DevVoice a question.</p>
        ) : (
          turns.map((turn) => (
            <article
              key={turn.id}
              className={`rounded-xl border p-3 text-sm ${
                turn.role === "user"
                  ? "border-neon-mint/40 bg-emerald-950/20 text-emerald-100"
                  : "border-neon-cyan/40 bg-cyan-950/20 text-cyan-100"
              }`}
            >
              <p className="mb-1 text-xs uppercase tracking-wide opacity-80">{turn.role}</p>
              <p className="whitespace-pre-wrap leading-relaxed">{turn.content}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
