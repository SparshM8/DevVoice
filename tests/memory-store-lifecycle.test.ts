import { describe, expect, it, vi } from "vitest";
import {
  appendTurn,
  ensureSession,
  getSessionTurns,
  listSessionSummaries,
  MAX_SERVER_SESSIONS,
  SERVER_SESSION_TTL_MS,
} from "@/lib/memory-store";

describe("temporary server session lifecycle", () => {
  it("expires inactive sessions after the documented TTL", () => {
    vi.useFakeTimers();
    const start = new Date("2050-01-01T00:00:00.000Z");
    vi.setSystemTime(start);
    const visitorId = "00000000-0000-4000-8000-0000000000f6";
    const session = ensureSession(visitorId, undefined, "Expiring session");
    appendTurn(visitorId, session.id, {
      id: "ttl-turn",
      role: "user",
      content: "temporary content",
      createdAt: start.toISOString(),
    });

    vi.setSystemTime(new Date(start.getTime() + SERVER_SESSION_TTL_MS + 1));

    expect(getSessionTurns(visitorId, session.id)).toEqual([]);
    expect(listSessionSummaries(visitorId)).toEqual([]);
    vi.useRealTimers();
  });

  it("evicts the oldest temporary session at capacity", () => {
    vi.useFakeTimers();
    const start = new Date("2060-01-01T00:00:00.000Z");
    vi.setSystemTime(start);
    const visitorId = "00000000-0000-4000-8000-0000000000f7";
    const oldest = ensureSession(visitorId, undefined, "Oldest session");

    for (let index = 0; index < MAX_SERVER_SESSIONS; index += 1) {
      vi.setSystemTime(new Date(start.getTime() + index + 1));
      ensureSession(visitorId, undefined, `Session ${index}`);
    }

    expect(getSessionTurns(visitorId, oldest.id)).toEqual([]);
    vi.useRealTimers();
  });
});
