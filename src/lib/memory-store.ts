import { randomUUID } from "crypto";
import { ChatTurn, SessionRecord, SessionSummary } from "@/lib/types";

export const SERVER_SESSION_TTL_MS = 6 * 60 * 60_000;
export const MAX_SERVER_SESSIONS = 500;

type ServerSession = SessionRecord & { visitorId: string };
const sessions = new Map<string, ServerSession>();

function inferTitle(input: string): string {
  const compact = input.replace(/\s+/g, " ").trim();
  if (!compact) return "New DevVoice Session";
  return compact.length > 48 ? `${compact.slice(0, 48)}...` : compact;
}

function pruneExpiredSessions(now = Date.now()) {
  for (const [sessionId, session] of sessions) {
    if (now - Date.parse(session.updatedAt) >= SERVER_SESSION_TTL_MS) {
      sessions.delete(sessionId);
    }
  }
}

function evictOldestSessionIfNeeded() {
  if (sessions.size < MAX_SERVER_SESSIONS) return;
  const oldest = [...sessions.values()].sort((a, b) => Date.parse(a.updatedAt) - Date.parse(b.updatedAt))[0];
  if (oldest) sessions.delete(oldest.id);
}

export function ensureSession(visitorId: string, sessionId?: string, seedText?: string): SessionRecord {
  pruneExpiredSessions();
  const existing = sessionId ? sessions.get(sessionId) : undefined;
  if (existing && existing.visitorId === visitorId) {
    return existing;
  }

  evictOldestSessionIfNeeded();
  const id = randomUUID();
  const now = new Date().toISOString();
  const session: ServerSession = {
    id,
    visitorId,
    title: inferTitle(seedText ?? ""),
    createdAt: now,
    updatedAt: now,
    turns: [],
  };
  sessions.set(id, session);
  return session;
}

export function appendTurn(visitorId: string, sessionId: string, turn: ChatTurn) {
  pruneExpiredSessions();
  const session = sessions.get(sessionId);
  if (!session || session.visitorId !== visitorId) return false;
  session.turns.push(turn);
  session.updatedAt = new Date().toISOString();
  return true;
}

export function listSessionSummaries(visitorId: string): SessionSummary[] {
  pruneExpiredSessions();
  return [...sessions.values()]
    .filter((session) => session.visitorId === visitorId)
    .map((session) => {
      const assistantMessages = session.turns.filter((turn) => turn.role === "assistant");
      const lastAssistantMessage = assistantMessages.at(-1)?.content ?? "No assistant response yet.";
      return {
        id: session.id,
        title: session.title,
        updatedAt: session.updatedAt,
        turnCount: session.turns.length,
        lastAssistantMessage,
      };
    })
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export function getSessionTurns(visitorId: string, sessionId: string): ChatTurn[] {
  pruneExpiredSessions();
  const session = sessions.get(sessionId);
  return session?.visitorId === visitorId ? session.turns : [];
}
