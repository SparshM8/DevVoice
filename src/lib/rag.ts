import { createHash } from "crypto";
import { chunkText } from "@/lib/chunker";
import { config } from "@/lib/config";
import { embedText, getVectorSize } from "@/lib/embeddings";
import { ensureCollection, searchContext, upsertContextPoint } from "@/lib/qdrant";
import { RetrievedChunk } from "@/lib/types";

function getStablePointId(visitorId: string, source: string, text: string): string {
  return createHash("sha256").update(`${visitorId}\0${source}\0${text}`).digest("hex").slice(0, 32);
}

export async function ingestKnowledge(input: {
  source: string;
  type: string;
  text: string;
  visitorId: string;
}) {
  const chunks = chunkText(input.text);
  if (chunks.length === 0) {
    return { chunksStored: 0, chunksCreated: 0 };
  }

  await ensureCollection(getVectorSize());
  let chunksCreated = 0;

  for (const chunk of chunks) {
    const vector = await embedText(chunk);
    const result = await upsertContextPoint({
      id: getStablePointId(input.visitorId, input.source, chunk),
      vector,
      text: chunk,
      source: input.source,
      type: input.type,
      visitorId: input.visitorId,
    });
    if (result.created) chunksCreated += 1;
  }

  return { chunksStored: chunks.length, chunksCreated };
}

export async function retrieveRelevantContext(query: string, visitorId: string): Promise<RetrievedChunk[]> {
  const vector = await embedText(query);
  return searchContext({
    vector,
    limit: config.maxContextChunks,
    visitorId,
  });
}
