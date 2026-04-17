type Props = {
  listening: boolean;
  thinking: boolean;
  speaking: boolean;
};

function Chip({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-medium ${
        active
          ? "animate-pulse-soft border-neon-cyan/60 bg-neon-cyan/15 text-neon-cyan"
          : "border-ink-700 bg-ink-900/80 text-slate-400"
      }`}
    >
      {label}
    </span>
  );
}

export function StatusChips(props: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <Chip active={props.listening} label="Listening" />
      <Chip active={props.thinking} label="Thinking" />
      <Chip active={props.speaking} label="Speaking" />
    </div>
  );
}
