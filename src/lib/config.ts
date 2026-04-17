export const config = {
  appName: "DevVoice",
  mockMode: process.env.MOCK_MODE !== "false",
  qdrantUrl: process.env.QDRANT_URL,
  qdrantApiKey: process.env.QDRANT_API_KEY,
  qdrantCollection: process.env.QDRANT_COLLECTION ?? "devvoice_context",
  openAiApiKey: process.env.OPENAI_API_KEY,
  embeddingsModel: process.env.EMBEDDINGS_MODEL ?? "text-embedding-3-small",
  llmModel: process.env.LLM_MODEL ?? "gpt-4o-mini",
  vapiPublicKey: process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY,
  vapiAssistantId: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID,
  maxContextChunks: Number(process.env.MAX_CONTEXT_CHUNKS ?? 6),
};

export function hasExternalLlmConfig() {
  const key = config.openAiApiKey?.trim();
  return !config.mockMode && Boolean(key);
}

export function hasQdrantConfig() {
  return Boolean(config.qdrantUrl);
}

export function getRuntimeMode() {
  return hasExternalLlmConfig() ? "external" : "mock";
}
