import { QdrantClient } from "@qdrant/js-client-rest";
import { config, hasQdrantConfig } from "@/lib/config";
import { cosineSimilarity } from "@/lib/utils";
import { RetrievedChunk } from "@/lib/types";

type PointPayload = {
  text: string;
  source: string;
  type: string;
};

type LocalPoint = {
  id: string;
  vector: number[];
  payload: PointPayload;
};

const localStore: LocalPoint[] = [];

function getClient() {
  if (!hasQdrantConfig()) {
    return null;
  }
  return new QdrantClient({
    url: config.qdrantUrl,
    apiKey: config.qdrantApiKey,
  });
}

export async function ensureCollection(vectorSize: number) {
  const client = getClient();
  if (!client) return;

  try {
    await client.getCollection(config.qdrantCollection);
  } catch {
    await client.createCollection(config.qdrantCollection, {
      vectors: {
        size: vectorSize,
        distance: "Cosine",
      },
    });
  }
}

export async function upsertContextPoint(params: {
  id: string;
  vector: number[];
  text: string;
  source: string;
  type: string;
}) {
  const point: LocalPoint = {
    id: params.id,
    vector: params.vector,
    payload: {
      text: params.text,
      source: params.source,
      type: params.type,
    },
  };

  const existing = localStore.findIndex((item) => item.id === point.id);
  if (existing >= 0) localStore.splice(existing, 1);
  localStore.push(point);

  const client = getClient();
  if (!client) return;

  await client.upsert(config.qdrantCollection, {
    wait: true,
    points: [
      {
        id: params.id,
        vector: params.vector,
        payload: point.payload,
      },
    ],
  });
}

export async function searchContext(params: {
  vector: number[];
  limit: number;
}): Promise<RetrievedChunk[]> {
  const localResults = localStore
    .map((point) => ({
      id: point.id,
      text: point.payload.text,
      source: point.payload.source,
      type: point.payload.type,
      score: cosineSimilarity(params.vector, point.vector),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, params.limit);

  const client = getClient();
  if (!client) {
    return localResults;
  }

  const remote = await client.search(config.qdrantCollection, {
    vector: params.vector,
    limit: params.limit,
    with_payload: true,
  });

  if (remote.length === 0) {
    return localResults;
  }

  return remote.map((item) => ({
    id: String(item.id),
    score: item.score,
    text: String(item.payload?.text ?? ""),
    source: String(item.payload?.source ?? "unknown"),
    type: String(item.payload?.type ?? "document"),
  }));
}
