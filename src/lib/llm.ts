import { config, hasExternalLlmConfig } from "@/lib/config";
import { ChatTurn, RetrievedChunk } from "@/lib/types";
import { mockDeveloperAnswer } from "@/lib/mock";

function buildPrompt(params: {
  message: string;
  history: ChatTurn[];
  context: RetrievedChunk[];
}): string {
  const historyText = params.history
    .slice(-6)
    .map((turn) => `${turn.role.toUpperCase()}: ${turn.content}`)
    .join("\n");

  const contextText = params.context
    .map((chunk, index) => `[${index + 1}] (${chunk.source}) ${chunk.text}`)
    .join("\n\n");

  return [
    "You are DevVoice, a practical developer assistant.",
    "Answer in a concise, technical, and action-oriented way.",
    "If debugging, include probable root cause and verification steps.",
    "If giving commands, prefer safe and explicit commands.",
    "",
    "Conversation history:",
    historyText || "No prior turns.",
    "",
    "Retrieved context:",
    contextText || "No retrieved context.",
    "",
    `User question: ${params.message}`,
  ].join("\n");
}

type ChatCompletionsPayload = {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string; type?: string };
};

async function callOpenAi(params: {
  message: string;
  history: ChatTurn[];
  context: RetrievedChunk[];
}): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.openAiApiKey}`,
      },
      body: JSON.stringify({
        model: config.llmModel,
        messages: [
          {
            role: "system",
            content:
              "You are DevVoice. Provide developer-friendly explanations, actionable debug steps, and short command snippets when relevant.",
          },
          {
            role: "user",
            content: buildPrompt(params),
          },
        ],
        temperature: 0.2,
      }),
      signal: controller.signal,
    });

    const payload = (await response.json()) as ChatCompletionsPayload;

    if (!response.ok) {
      const errorMessage = payload.error?.message ?? "Unknown provider error";
      throw new Error(`OpenAI ${response.status}: ${errorMessage}`);
    }

    const answer = payload.choices?.[0]?.message?.content?.trim();
    if (!answer) {
      throw new Error("OpenAI returned an empty completion.");
    }

    return answer;
  } finally {
    clearTimeout(timeout);
  }
}

export async function generateDeveloperResponse(params: {
  message: string;
  history: ChatTurn[];
  context: RetrievedChunk[];
}): Promise<{ answer: string; suggestions: string[] }> {
  if (!hasExternalLlmConfig()) {
    return mockDeveloperAnswer(params.message);
  }

  try {
    const answer = await callOpenAi(params);
    return {
      answer,
      suggestions: [
        "Ask follow-up: explain the root cause with a minimal reproducible example.",
        "Ask for exact terminal commands to validate the fix.",
        "Request a patch-style code change suggestion.",
      ],
    };
  } catch (error) {
    const fallback = mockDeveloperAnswer(params.message);
    const reason = error instanceof Error ? error.message : "Unknown provider failure";

    console.error(`[llm] Falling back to mock response: ${reason}`);

    return {
      answer: `${fallback.answer}\n\nNote: External LLM request failed, so DevVoice used safe fallback mode. Reason: ${reason}`,
      suggestions: [
        "Verify OPENAI_API_KEY is valid and has billing enabled.",
        "Set LLM_MODEL to a model your account can access (for example gpt-4o-mini).",
        "Check /api/status and confirm runtimeMode is external with mockMode=false.",
      ],
    };
  }
}
