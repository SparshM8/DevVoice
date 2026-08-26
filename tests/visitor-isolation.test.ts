import { describe, expect, it } from "vitest";
import { appendTurn, ensureSession, getSessionTurns, listSessionSummaries } from "@/lib/memory-store";
import { searchContext, upsertContextPoint } from "@/lib/qdrant";

describe("anonymous visitor isolation", () => {
  it("does not expose one visitor's session or accept a foreign session id", () => {
    const visitorA = "00000000-0000-4000-8000-0000000000a1";
    const visitorB = "00000000-0000-4000-8000-0000000000b2";
    const sessionA = ensureSession(visitorA, undefined, "Visitor A question");

    appendTurn(visitorA, sessionA.id, {
      id: "turn-a",
      role: "user",
      content: "private visitor A text",
      createdAt: new Date().toISOString(),
    });

    expect(listSessionSummaries(visitorA)).toHaveLength(1);
    expect(listSessionSummaries(visitorB)).toHaveLength(0);
    expect(getSessionTurns(visitorB, sessionA.id)).toEqual([]);

    const remapped = ensureSession(visitorB, sessionA.id, "Visitor B question");
    expect(remapped.id).not.toBe(sessionA.id);
    expect(listSessionSummaries(visitorB).map((summary) => summary.id)).toContain(remapped.id);
  });

  it("returns only the current visitor's local knowledge points", async () => {
    const visitorA = "00000000-0000-4000-8000-0000000000c3";
    const visitorB = "00000000-0000-4000-8000-0000000000d4";
    const vector = new Array(256).fill(0);
    vector[0] = 1;

    await upsertContextPoint({
      id: "shared-point-id",
      vector,
      text: "private context A",
      source: "a.txt",
      type: "text",
      visitorId: visitorA,
    });
    await upsertContextPoint({
      id: "shared-point-id",
      vector,
      text: "private context B",
      source: "b.txt",
      type: "text",
      visitorId: visitorB,
    });

    const resultsA = await searchContext({ vector, limit: 10, visitorId: visitorA });
    const resultsB = await searchContext({ vector, limit: 10, visitorId: visitorB });

    expect(resultsA.map((result) => result.text)).toContain("private context A");
    expect(resultsA.map((result) => result.text)).not.toContain("private context B");
    expect(resultsB.map((result) => result.text)).toContain("private context B");
    expect(resultsB.map((result) => result.text)).not.toContain("private context A");
  });
});
