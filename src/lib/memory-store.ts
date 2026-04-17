import { randomUUID } from "crypto";
import { ChatTurn, SessionRecord, SessionSummary } from "@/lib/types";

const sessions = new Map<string, SessionRecord>();

function inferTitle(input: string): string {
  const compact = input.replace(/\s+/g, " ").trim();
  if (!compact) return "New DevVoice Session";
  return compact.length > 48 ? `${compact.slice(0, 48)}...` : compact;
}

export function ensureSession(sessionId?: string, seedText?: string): SessionRecord {
  if (sessionId && sessions.has(sessionId)) {
    return sessions.get(sessionId)!;
  }
  const id = sessionId ?? randomUUID();
  const now = new Date().toISOString();
  const session: SessionRecord = {
    id,
    title: inferTitle(seedText ?? ""),
    createdAt: now,
    updatedAt: now,
    turns: [],
  };
  sessions.set(id, session);
  return session;
}

export function appendTurn(sessionId: string, turn: ChatTurn) {
  const session = ensureSession(sessionId);
  session.turns.push(turn);
  session.updatedAt = new Date().toISOString();
}

export function listSessionSummaries(): SessionSummary[] {
  return [...sessions.values()]
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

export function getSessionTurns(sessionId: string): ChatTurn[] {
  return ensureSession(sessionId).turns;
}
