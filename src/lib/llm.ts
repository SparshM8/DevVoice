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

export async function generateDeveloperResponse(params: {
  message: string;
  history: ChatTurn[];
  context: RetrievedChunk[];
}): Promise<{ answer: string; suggestions: string[] }> {
  if (!hasExternalLlmConfig()) {
    return mockDeveloperAnswer(params.message);
  }

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
  });

  if (!response.ok) {
    return mockDeveloperAnswer(params.message);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const answer = payload.choices?.[0]?.message?.content?.trim();

  return {
    answer: answer || "I could not generate a response right now.",
    suggestions: [
      "Ask follow-up: explain the root cause with a minimal reproducible example.",
      "Ask for exact terminal commands to validate the fix.",
      "Request a patch-style code change suggestion.",
    ],
  };
}
