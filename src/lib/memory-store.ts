import { randomUUID } from "crypto";
import { ChatTurn, SessionRecord, SessionSummary } from "@/lib/types";

const sessions = new Map<string, SessionRecord & { visitorId: string }>();

function inferTitle(input: string): string {
  const compact = input.replace(/\s+/g, " ").trim();
  if (!compact) return "New DevVoice Session";
  return compact.length > 48 ? `${compact.slice(0, 48)}...` : compact;
}

export function ensureSession(visitorId: string, sessionId?: string, seedText?: string): SessionRecord {
  const existing = sessionId ? sessions.get(sessionId) : undefined;
  if (existing && existing.visitorId === visitorId) {
    return existing;
  }

  const id = randomUUID();
  const now = new Date().toISOString();
  const session: SessionRecord & { visitorId: string } = {
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
  const session = sessions.get(sessionId);
  if (!session || session.visitorId !== visitorId) return false;
  session.turns.push(turn);
  session.updatedAt = new Date().toISOString();
  return true;
}

export function listSessionSummaries(visitorId: string): SessionSummary[] {
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
  const session = sessions.get(sessionId);
  return session?.visitorId === visitorId ? session.turns : [];
}
