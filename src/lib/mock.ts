export function mockDeveloperAnswer(message: string) {
  const lower = message.toLowerCase();

  if (lower.includes("useeffect") && (lower.includes("rerender") || lower.includes("render"))) {
    return {
      answer:
        "Your useEffect likely depends on state that it updates. That creates a loop: render -> effect -> setState -> render. Keep effect dependencies stable, avoid recreating objects/functions inline, and split fetch side-effects from derived state.",
      suggestions: [
        "Check if effect dependency array includes mutable values recreated per render.",
        "Wrap callbacks with useCallback and computed values with useMemo.",
        "Guard setState inside effect with a conditional diff check.",
      ],
    };
  }

  if (lower.includes("stack trace") || lower.includes("error")) {
    return {
      answer:
        "Start from the first application frame in the trace, identify the failing function input, and verify the assumptions before that call. Most recurring bugs here are null inputs, invalid async ordering, or unexpected shape changes from API responses.",
      suggestions: [
        "Isolate the first non-library line in the trace.",
        "Log the exact value/type at that line.",
        "Reproduce with a minimal input fixture.",
      ],
    };
  }

  return {
    answer:
      "DevVoice mock mode is active. Ask about code behavior, errors, APIs, or workflows and I will give a structured explanation with actionable next steps.",
    suggestions: [
      "Paste a stack trace and ask for root cause analysis.",
      "Share a code block and ask for refactor guidance.",
      "Ask for shell commands to verify or fix an issue.",
    ],
  };
}
