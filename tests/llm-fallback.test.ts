import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("external LLM fallback", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("MOCK_MODE", "false");
    vi.stubEnv("OPENAI_API_KEY", "invalid-test-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("streams a useful mock answer when OpenAI rejects authentication", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("Unauthorized", { status: 401, statusText: "Unauthorized" }))
    );

    const { generateDeveloperResponseStream } = await import("@/lib/llm");
    const generator = generateDeveloperResponseStream({
      message: "Why does React useEffect cause repeated renders?",
      history: [],
      context: [],
    });
    const events: Array<string | { type: "action"; message: string }> = [];
    let result = await generator.next();

    while (!result.done) {
      events.push(result.value);
      result = await generator.next();
    }

    const text = events
      .filter((event): event is string => typeof event === "string")
      .join("");

    expect(events).toContainEqual({ type: "action", message: "External LLM unavailable. Switching to mock fallback..." });
    expect(text).toContain("Your useEffect likely depends on state that it updates.");
    expect(result.value.suggestions).toContain("Check the external LLM credentials before switching back to live mode.");
  });
});
