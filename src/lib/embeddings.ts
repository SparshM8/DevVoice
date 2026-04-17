import { config, hasExternalLlmConfig } from "@/lib/config";

const VECTOR_SIZE = 256;

function tokenHash(token: string): number {
  let hash = 2166136261;
  for (let i = 0; i < token.length; i += 1) {
    hash ^= token.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return Math.abs(hash);
}

function localEmbed(text: string): number[] {
  const vector = new Array<number>(VECTOR_SIZE).fill(0);
  const tokens = text.toLowerCase().split(/[^a-z0-9_]+/).filter(Boolean);
  for (const token of tokens) {
    const idx = tokenHash(token) % VECTOR_SIZE;
    vector[idx] += 1;
  }

  const mag = Math.sqrt(vector.reduce((sum, n) => sum + n * n, 0));
  if (mag === 0) return vector;
  return vector.map((v) => v / mag);
}

export async function embedText(text: string): Promise<number[]> {
  if (!hasExternalLlmConfig()) {
    return localEmbed(text);
  }

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.openAiApiKey}`,
    },
    body: JSON.stringify({
      model: config.embeddingsModel,
      input: text,
    }),
  });

  if (!response.ok) {
    return localEmbed(text);
  }

  const payload = (await response.json()) as {
    data?: Array<{ embedding: number[] }>;
  };
  return payload.data?.[0]?.embedding ?? localEmbed(text);
}

export function getVectorSize() {
  return VECTOR_SIZE;
}
