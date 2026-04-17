import { randomUUID } from "crypto";
import { chunkText } from "@/lib/chunker";
import { config } from "@/lib/config";
import { embedText, getVectorSize } from "@/lib/embeddings";
import { ensureCollection, searchContext, upsertContextPoint } from "@/lib/qdrant";
import { RetrievedChunk } from "@/lib/types";

export async function ingestKnowledge(input: {
  source: string;
  type: string;
  text: string;
}) {
  const chunks = chunkText(input.text);
  if (chunks.length === 0) {
    return { chunksStored: 0 };
  }

  await ensureCollection(getVectorSize());

  for (const chunk of chunks) {
    const vector = await embedText(chunk);
    await upsertContextPoint({
      id: randomUUID(),
      vector,
      text: chunk,
      source: input.source,
      type: input.type,
    });
  }

  return { chunksStored: chunks.length };
}

export async function retrieveRelevantContext(query: string): Promise<RetrievedChunk[]> {
  const vector = await embedText(query);
  return searchContext({
    vector,
    limit: config.maxContextChunks,
  });
}
