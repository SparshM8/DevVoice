"use client";

import { Mic, MicOff, Square } from "lucide-react";

type Props = {
  transcriptDraft: string;
  listening: boolean;
  continuous: boolean;
  onStartPushToTalk: () => void;
  onStopListening: () => void;
  onToggleContinuous: () => void;
};

export function FloatingVoicePanel(props: Props) {
  return (
    <div className="fixed bottom-5 right-5 z-50 w-[320px] rounded-2xl border border-ink-700 bg-ink-900/90 p-4 shadow-glow backdrop-blur">
      <p className="text-xs uppercase tracking-wide text-neon-cyan">Voice panel</p>
      <p className="mt-2 min-h-[44px] text-sm text-slate-200">
        {props.transcriptDraft || "Waiting for voice input..."}
      </p>

      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={props.listening ? props.onStopListening : props.onStartPushToTalk}
          className="flex items-center gap-2 rounded-xl bg-neon-cyan px-3 py-2 text-sm font-medium text-ink-950"
        >
          {props.listening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          {props.listening ? "Stop" : "Push to talk"}
        </button>
        <button
          onClick={props.onToggleContinuous}
          className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
            props.continuous
              ? "border-neon-mint/70 bg-neon-mint/15 text-neon-mint"
              : "border-ink-700 bg-ink-950/80 text-slate-300"
          }`}
        >
          {props.continuous ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          Continuous
        </button>
      </div>
    </div>
  );
}
