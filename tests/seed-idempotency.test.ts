import { describe, expect, it } from "vitest";
import { ingestKnowledge, retrieveRelevantContext } from "@/lib/rag";

describe("knowledge ingestion", () => {
  it("does not create duplicate points when the same document is ingested twice", async () => {
    const visitorId = "00000000-0000-4000-8000-0000000000e5";
    const input = {
      source: "repeatable-seed.txt",
      type: "text",
      text: "A deterministic DevVoice seed fixture for retrieval idempotency.",
      visitorId,
    };

    const first = await ingestKnowledge(input);
    const second = await ingestKnowledge(input);
    const results = await retrieveRelevantContext("deterministic retrieval idempotency", visitorId);

    expect(first.chunksCreated).toBeGreaterThan(0);
    expect(second.chunksCreated).toBe(0);
    expect(results.filter((result) => result.source === input.source)).toHaveLength(1);
  });
});
