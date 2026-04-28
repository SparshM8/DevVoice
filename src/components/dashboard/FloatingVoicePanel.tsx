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
    <div className="fixed bottom-5 right-5 z-50 w-[320px] rounded-xl border border-ink-800 bg-black/80 p-4 shadow-2xl backdrop-blur-xl">
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Voice Input</p>
      <p className="mt-2 min-h-[44px] text-sm text-zinc-200">
        {props.transcriptDraft || "Waiting for voice input..."}
      </p>

      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={props.listening ? props.onStopListening : props.onStartPushToTalk}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
            props.listening
              ? "bg-zinc-800 text-zinc-100 border border-zinc-600"
              : "bg-zinc-100 text-black border border-transparent hover:bg-white"
          }`}
        >
          {props.listening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          {props.listening ? "Stop" : "Push to talk"}
        </button>
        <button
          onClick={props.onToggleContinuous}
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
            props.continuous
              ? "border-zinc-500 bg-zinc-800/80 text-zinc-100"
              : "border-ink-800 bg-ink-900 text-zinc-400 hover:bg-ink-800 hover:text-zinc-200"
          }`}
        >
          {props.continuous ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          Continuous
        </button>
      </div>
    </div>
  );
}
