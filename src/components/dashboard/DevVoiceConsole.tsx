"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ChatTurn, RetrievedChunk, SessionRecord } from "@/lib/types";
import { TranscriptPanel } from "@/components/dashboard/TranscriptPanel";
import { ContextCards } from "@/components/dashboard/ContextCards";
import { SuggestedActions } from "@/components/dashboard/SuggestedActions";
import { FloatingVoicePanel } from "@/components/dashboard/FloatingVoicePanel";
import { StatusChips } from "@/components/dashboard/StatusChips";
import {
  clearAllLocalSessions,
  deleteSessionLocally,
  duplicateSessionLocally,
  getAllSessionsLocally,
  getLastSessionIdLocally,
  saveSessionLocally,
} from "@/lib/storage";

type RecognitionCtor = new () => {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

declare global {
  interface Window {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  }
}

function speakText(text: string, onStart: () => void, onEnd: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.onstart = onStart;
  utterance.onend = onEnd;
  window.speechSynthesis.speak(utterance);
}

function makeId() {
  if (typeof window !== "undefined" && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function inferTitle(text: string) {
  const compact = text.replace(/\s+/g, " ").trim();
  if (!compact) return "New DevVoice Session";
  return compact.length > 48 ? `${compact.slice(0, 48)}...` : compact;
}

function hydrateFromSession(
  session: SessionRecord,
  setSessionId: (value: string | undefined) => void,
  setTurns: (value: ChatTurn[]) => void,
  setContexts: (value: RetrievedChunk[]) => void,
  setActions: (value: string[]) => void
) {
  setSessionId(session.id);
  setTurns(session.turns ?? []);
  setContexts(session.lastContexts ?? []);
  setActions(session.lastSuggestions ?? []);
}

export function DevVoiceConsole() {
  const [sessionId, setSessionId] = useState<string>();
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [contexts, setContexts] = useState<RetrievedChunk[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [savedSessions, setSavedSessions] = useState<SessionRecord[]>([]);
  const [sessionFilter, setSessionFilter] = useState("");
  const [thinking, setThinking] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [continuous, setContinuous] = useState(false);
  const [transcriptDraft, setTranscriptDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<InstanceType<RecognitionCtor> | null>(null);

  const refreshSavedSessions = () => {
    setSavedSessions(getAllSessionsLocally());
  };

  useEffect(() => {
    refreshSavedSessions();
    const lastSessionId = getLastSessionIdLocally();
    if (!lastSessionId) return;

    const lastSession = getAllSessionsLocally().find((session) => session.id === lastSessionId);
    if (!lastSession) return;

    hydrateFromSession(lastSession, setSessionId, setTurns, setContexts, setActions);
  }, []);

  const localSessionCount = savedSessions.length;

  const filteredSessions = useMemo(() => {
    const query = sessionFilter.trim().toLowerCase();
    if (!query) return savedSessions;
    return savedSessions.filter((session) => {
      const haystack = `${session.title} ${session.turns.map((turn) => turn.content).join(" ")}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [savedSessions, sessionFilter]);

  const latestAssistantText = useMemo(() => {
    return [...turns].reverse().find((turn) => turn.role === "assistant")?.content ?? "";
  }, [turns]);

  const selectedSessionLabel =
    savedSessions.find((session) => session.id === sessionId)?.title ??
    (sessionId ? "Unsaved current session" : "No session selected");

  const selectSession = (targetSession: SessionRecord) => {
    hydrateFromSession(targetSession, setSessionId, setTurns, setContexts, setActions);
    setError(null);
  };

  const deleteSavedSession = (targetSessionId: string) => {
    deleteSessionLocally(targetSessionId);
    refreshSavedSessions();
    if (sessionId === targetSessionId) {
      setSessionId(undefined);
      setTurns([]);
      setContexts([]);
      setActions([]);
      setTranscriptDraft("");
      setError(null);
    }
  };

  const duplicateSavedSession = (targetSessionId: string) => {
    const duplicate = duplicateSessionLocally(targetSessionId);
    if (!duplicate) {
      setError("Could not duplicate session.");
      return;
    }
    refreshSavedSessions();
    selectSession(duplicate);
  };

  const sendMessage = async (message: string) => {
    if (!message.trim()) return;

    setThinking(true);
    setError(null);
    const userTurn: ChatTurn = {
      id: makeId(),
      role: "user",
      content: message,
      createdAt: new Date().toISOString(),
    };
    setTurns((prev) => [...prev, userTurn]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, sessionId }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Chat failed.");
      }

      const assistantTurn: ChatTurn = {
        id: makeId(),
        role: "assistant",
        content: data.answer,
        createdAt: new Date().toISOString(),
      };

      const resolvedContexts: RetrievedChunk[] = data.contexts ?? [];
      const resolvedActions: string[] = data.suggestions ?? [];

      setSessionId(data.sessionId);
      setTurns((prev) => [...prev, assistantTurn]);
      setContexts(resolvedContexts);
      setActions(resolvedActions);

      const localSessions = getAllSessionsLocally();
      const existingSession = localSessions.find((session) => session.id === data.sessionId);
      const existingTurns = existingSession?.turns ?? [];

      const sessionForStorage: SessionRecord = {
        id: data.sessionId,
        title: existingSession?.title ?? inferTitle(message),
        createdAt: existingSession?.createdAt ?? userTurn.createdAt,
        updatedAt: new Date().toISOString(),
        turns: [...existingTurns, userTurn, assistantTurn],
        lastContexts: resolvedContexts,
        lastSuggestions: resolvedActions,
      };
      saveSessionLocally(sessionForStorage);
      refreshSavedSessions();

      speakText(
        data.answer,
        () => setSpeaking(true),
        () => setSpeaking(false)
      );
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Unknown error.");
    } finally {
      setThinking(false);
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = input;
    setInput("");
    await sendMessage(message);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const startListening = () => {
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Ctor) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new Ctor();
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = async (event: any) => {
      let finalText = "";
      let interimText = "";
      for (let i = 0; i < event.results.length; i += 1) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += transcript;
        } else {
          interimText += transcript;
        }
      }
      setTranscriptDraft(interimText || finalText);
      if (finalText.trim()) {
        setTranscriptDraft("");
        await sendMessage(finalText.trim());
        if (!continuous) {
          recognition.stop();
          setListening(false);
        }
      }
    };
    recognition.onend = () => {
      if (!continuous) {
        setListening(false);
      }
    };
    recognition.onerror = () => setError("Voice recognition error.");
    recognition.start();
    recognitionRef.current = recognition;
    setListening(true);
  };

  const resumeLastSession = () => {
    const localSessions = getAllSessionsLocally();
    const lastSessionId = getLastSessionIdLocally();
    if (!lastSessionId) {
      setError("No local session available to resume.");
      return;
    }

    const lastSession = localSessions.find((session) => session.id === lastSessionId);
    if (!lastSession) {
      setError("No local session available to resume.");
      return;
    }

    hydrateFromSession(lastSession, setSessionId, setTurns, setContexts, setActions);
    setError(null);
  };

  const startNewSession = () => {
    setSessionId(undefined);
    setTurns([]);
    setContexts([]);
    setActions([]);
    setTranscriptDraft("");
    setError(null);
  };

  const clearLocalData = () => {
    clearAllLocalSessions();
    startNewSession();
    setSavedSessions([]);
  };

  return (
    <div className="pb-24">
      <section className="glass rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-white">Developer Voice Console</h1>
            <p className="mt-1 text-sm text-slate-300">
              Explain code, debug issues, summarize docs, and generate fixes with contextual recall.
            </p>
          </div>
          <StatusChips listening={listening} thinking={thinking} speaking={speaking} />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={resumeLastSession}
            className="rounded-xl border border-ink-700 bg-ink-900/80 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-neon-cyan/60 hover:text-white"
          >
            Resume Last Session
          </button>
          <button
            type="button"
            onClick={startNewSession}
            className="rounded-xl border border-ink-700 bg-ink-900/80 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-neon-mint/60 hover:text-white"
          >
            Start New Session
          </button>
          <button
            type="button"
            onClick={clearLocalData}
            className="rounded-xl border border-red-900/70 bg-red-950/40 px-3 py-2 text-xs font-medium text-red-200 transition hover:border-red-700 hover:text-red-100"
          >
            Clear Local Sessions ({localSessionCount})
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-ink-700 bg-ink-950/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Saved Sessions</p>
              <p className="mt-1 text-sm text-slate-200">{selectedSessionLabel}</p>
            </div>
            <button
              type="button"
              onClick={refreshSavedSessions}
              className="rounded-lg border border-ink-700 px-3 py-2 text-xs text-slate-300 transition hover:border-neon-cyan/60 hover:text-white"
            >
              Refresh List
            </button>
          </div>
          <div className="mt-3 flex flex-col gap-3">
            <input
              value={sessionFilter}
              onChange={(event) => setSessionFilter(event.target.value)}
              placeholder="Filter sessions by title or content..."
              className="w-full rounded-xl border border-ink-700 bg-ink-900/80 px-4 py-2 text-sm text-slate-100 outline-none focus:border-neon-cyan/50"
            />
            <div className="flex flex-wrap gap-2">
              {filteredSessions.length === 0 ? (
                <span className="text-sm text-slate-400">No matching sessions.</span>
              ) : (
                filteredSessions.map((session) => (
                  <div
                    key={session.id}
                    className={`flex items-center gap-2 rounded-full border px-2 py-2 ${
                      session.id === sessionId
                        ? "border-neon-cyan bg-neon-cyan/15"
                        : "border-ink-700 bg-ink-900/80"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => selectSession(session)}
                      className={`rounded-full px-2 py-0.5 text-xs transition ${
                        session.id === sessionId
                          ? "text-neon-cyan"
                          : "text-slate-300 hover:text-white"
                      }`}
                    >
                      {session.title}
                    </button>
                    <button
                      type="button"
                      onClick={() => duplicateSavedSession(session.id)}
                      className="rounded-full border border-amber-700/60 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-200 transition hover:border-amber-500 hover:text-amber-100"
                      aria-label={`Duplicate session ${session.title}`}
                    >
                      Duplicate
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteSavedSession(session.id)}
                      className="rounded-full border border-red-900/60 px-2 py-0.5 text-[10px] uppercase tracking-wide text-red-200 transition hover:border-red-700 hover:text-red-100"
                      aria-label={`Delete session ${session.title}`}
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask a technical question or paste logs/stack trace..."
            className="w-full rounded-xl border border-ink-700 bg-ink-900/80 px-4 py-3 text-sm text-slate-100 outline-none focus:border-neon-cyan/50"
          />
          <button
            type="submit"
            disabled={thinking}
            className="rounded-xl bg-neon-cyan px-5 py-3 font-medium text-ink-950 transition hover:bg-cyan-300 disabled:opacity-60"
          >
            {thinking ? "Thinking..." : "Send"}
          </button>
        </form>

        {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[1.35fr,1fr]">
        <TranscriptPanel turns={turns} />
        <div className="space-y-4">
          <ContextCards chunks={contexts} />
          <SuggestedActions actions={actions} />
        </div>
      </section>

      <FloatingVoicePanel
        transcriptDraft={transcriptDraft}
        listening={listening}
        continuous={continuous}
        onStartPushToTalk={startListening}
        onStopListening={stopListening}
        onToggleContinuous={() => setContinuous((prev) => !prev)}
      />

      {latestAssistantText ? (
        <section className="code-frame mt-6 rounded-2xl p-5">
          <p className="text-xs uppercase tracking-wide text-slate-400">Latest Debug Result</p>
          <pre className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{latestAssistantText}</pre>
        </section>
      ) : null}
    </div>
  );
}