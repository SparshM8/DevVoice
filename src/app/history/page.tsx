"use client";

import { useEffect, useMemo, useState } from "react";
import { TopNav } from "@/components/layout/TopNav";
import { SessionRecord, SessionSummary } from "@/lib/types";
import {
  clearAllLocalSessions,
  deleteSessionLocally,
  duplicateSessionLocally,
  getAllSessionsLocally,
} from "@/lib/storage";

function toSummary(session: SessionRecord): SessionSummary {
  const assistantMessages = session.turns.filter((turn) => turn.role === "assistant");
  return {
    id: session.id,
    title: session.title,
    updatedAt: session.updatedAt,
    turnCount: session.turns.length,
    lastAssistantMessage: assistantMessages.at(-1)?.content ?? "No assistant response yet.",
  };
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadSessions = () => {
    const local = getAllSessionsLocally().map(toSummary);

    void fetch("/api/history")
      .then((res) => res.json())
      .then((data) => {
        const remote: SessionSummary[] = data.sessions ?? [];
        const merged = [...remote];
        for (const localItem of local) {
          if (!merged.some((item) => item.id === localItem.id)) {
            merged.push(localItem);
          }
        }
        merged.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
        setSessions(merged);
        setError(null);
      })
      .catch(() => {
        if (local.length > 0) {
          setSessions(local.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)));
          setError(null);
        } else {
          setError("Could not load session history.");
        }
      });
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const filteredSessions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return sessions;
    return sessions.filter((session) => {
      const haystack = `${session.title} ${session.lastAssistantMessage}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [sessions, search]);

  const clearLocalCache = () => {
    clearAllLocalSessions();
    setSessions([]);
    setError(null);
  };

  const duplicateSavedSession = (sessionId: string) => {
    const duplicate = duplicateSessionLocally(sessionId);
    if (!duplicate) {
      setError("Could not duplicate this session. Only local sessions can be duplicated.");
      return;
    }
    loadSessions();
  };

  const deleteSavedSession = (sessionId: string) => {
    deleteSessionLocally(sessionId);
    loadSessions();
  };

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-white">Session History</h1>
            <p className="mt-2 text-slate-300">Review previous interactions and continuity context.</p>
          </div>
          <button
            type="button"
            onClick={clearLocalCache}
            className="rounded-xl border border-red-900/70 bg-red-950/40 px-3 py-2 text-xs font-medium text-red-200 transition hover:border-red-700 hover:text-red-100"
          >
            Clear Local Cache
          </button>
        </div>

        <div className="mt-4">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search sessions by title or latest assistant response..."
            className="w-full rounded-xl border border-ink-700 bg-ink-900/80 px-4 py-3 text-sm text-slate-100 outline-none focus:border-neon-cyan/50"
          />
        </div>

        {error ? <p className="mt-4 text-red-300">{error}</p> : null}

        {filteredSessions.length === 0 ? (
          <div className="glass mt-6 rounded-2xl p-6 text-slate-300">No sessions found for this view.</div>
        ) : (
          <div className="mt-6 grid gap-3">
            {filteredSessions.map((session) => (
              <article key={session.id} className="glass rounded-2xl p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-medium text-white">{session.title}</h2>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-ink-700 px-3 py-1 text-xs text-slate-300">
                      {session.turnCount} turns
                    </span>
                    <button
                      type="button"
                      onClick={() => duplicateSavedSession(session.id)}
                      className="rounded-full border border-amber-700/60 px-3 py-1 text-xs uppercase tracking-wide text-amber-200 transition hover:border-amber-500 hover:text-amber-100"
                    >
                      Duplicate
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteSavedSession(session.id)}
                      className="rounded-full border border-red-900/60 px-3 py-1 text-xs uppercase tracking-wide text-red-200 transition hover:border-red-700 hover:text-red-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-sm text-slate-300">Updated {new Date(session.updatedAt).toLocaleString()}</p>
                <p className="mt-3 text-sm text-slate-200">{session.lastAssistantMessage}</p>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}