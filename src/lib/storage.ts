"use client";

import { ChatTurn, SessionRecord } from "@/lib/types";

const STORAGE_KEY_PREFIX = "devvoice_";
const SESSION_STORE_KEY = `${STORAGE_KEY_PREFIX}sessions`;
const LAST_SESSION_KEY = `${STORAGE_KEY_PREFIX}last_session_id`;

function makeLocalId() {
  if (typeof window !== "undefined" && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function saveSessionLocally(session: SessionRecord) {
  if (typeof window === "undefined") return;
  try {
    const sessions = getAllSessionsLocally();
    const idx = sessions.findIndex((s) => s.id === session.id);
    if (idx >= 0) {
      sessions.splice(idx, 1);
    }
    sessions.unshift(session);
    window.localStorage.setItem(SESSION_STORE_KEY, JSON.stringify(sessions.slice(0, 20)));
    window.localStorage.setItem(LAST_SESSION_KEY, session.id);
  } catch {
    // Silent fail on storage quota or disabled storage
  }
}

export function getAllSessionsLocally(): SessionRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const data = window.localStorage.getItem(SESSION_STORE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function getSessionByIdLocally(sessionId: string): SessionRecord | null {
  const sessions = getAllSessionsLocally();
  return sessions.find((session) => session.id === sessionId) ?? null;
}

export function getLastSessionIdLocally(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(LAST_SESSION_KEY);
  } catch {
    return null;
  }
}

export function appendTurnLocally(sessionId: string, turn: ChatTurn) {
  if (typeof window === "undefined") return;
  try {
    const sessions = getAllSessionsLocally();
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      session.turns.push(turn);
      session.updatedAt = new Date().toISOString();
      saveSessionLocally(session);
    }
  } catch {
    // Silent fail
  }
}

export function duplicateSessionLocally(sessionId: string): SessionRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const source = getSessionByIdLocally(sessionId);
    if (!source) return null;

    const now = new Date().toISOString();
    const duplicate: SessionRecord = {
      ...source,
      id: makeLocalId(),
      title: `Copy of ${source.title}`,
      createdAt: now,
      updatedAt: now,
      turns: source.turns.map((turn) => ({
        ...turn,
        id: makeLocalId(),
      })),
      lastContexts: source.lastContexts ? [...source.lastContexts] : [],
      lastSuggestions: source.lastSuggestions ? [...source.lastSuggestions] : [],
    };

    saveSessionLocally(duplicate);
    return duplicate;
  } catch {
    return null;
  }
}

export function deleteSessionLocally(sessionId: string) {
  if (typeof window === "undefined") return;
  try {
    const sessions = getAllSessionsLocally().filter((session) => session.id !== sessionId);
    window.localStorage.setItem(SESSION_STORE_KEY, JSON.stringify(sessions));
    if (window.localStorage.getItem(LAST_SESSION_KEY) === sessionId) {
      window.localStorage.removeItem(LAST_SESSION_KEY);
    }
  } catch {
    // Silent fail
  }
}

export function clearAllLocalSessions() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SESSION_STORE_KEY);
    window.localStorage.removeItem(LAST_SESSION_KEY);
  } catch {
    // Silent fail
  }
}