type Props = {
  listening: boolean;
  thinking: boolean;
  speaking: boolean;
};

function Chip({ active, label, isAudio }: { active: boolean; label: string; isAudio?: boolean }) {
  return (
    <span
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all duration-300 ${
        active
          ? "border-zinc-600 bg-zinc-800/80 text-zinc-100 shadow-[0_0_10px_rgba(255,255,255,0.05)]"
          : "border-ink-800 bg-ink-900/50 text-zinc-500"
      }`}
    >
      {isAudio && active ? (
        <div className="flex h-3 items-end gap-[2px]">
          <div className="w-[2px] h-full bg-zinc-300 sound-wave" style={{ animationDelay: "0.1s" }} />
          <div className="w-[2px] h-3/4 bg-zinc-300 sound-wave" style={{ animationDelay: "0.3s" }} />
          <div className="w-[2px] h-1/2 bg-zinc-300 sound-wave" style={{ animationDelay: "0.0s" }} />
          <div className="w-[2px] h-full bg-zinc-300 sound-wave" style={{ animationDelay: "0.2s" }} />
        </div>
      ) : active ? (
        <div className="h-2 w-2 rounded-full bg-zinc-300 animate-pulse-soft" />
      ) : null}
      {label}
    </span>
  );
}

export function StatusChips(props: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <Chip active={props.listening} label="Listening" isAudio />
      <Chip active={props.thinking} label="Thinking" />
      <Chip active={props.speaking} label="Speaking" isAudio />
    </div>
  );
}
