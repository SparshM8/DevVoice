import { QdrantClient } from "@qdrant/js-client-rest";
import { config, hasQdrantConfig } from "@/lib/config";
import { cosineSimilarity } from "@/lib/utils";
import { RetrievedChunk } from "@/lib/types";

type PointPayload = {
  text: string;
  source: string;
  type: string;
  visitorId: string;
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
  visitorId: string;
}) {
  const point: LocalPoint = {
    id: params.id,
    vector: params.vector,
    payload: {
      text: params.text,
      source: params.source,
      type: params.type,
      visitorId: params.visitorId,
    },
  };

  const existing = localStore.findIndex((item) => item.id === point.id && item.payload.visitorId === point.payload.visitorId);
  if (existing >= 0) {
    localStore[existing] = point;
  } else {
    localStore.push(point);
  }

  const client = getClient();
  if (client) {
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

  return { created: existing < 0 };
}

export async function searchContext(params: {
  vector: number[];
  limit: number;
  visitorId: string;
}): Promise<RetrievedChunk[]> {
  const localResults = localStore
    .filter((point) => point.payload.visitorId === params.visitorId)
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

  await ensureCollection(params.vector.length);

  let remote: Awaited<ReturnType<typeof client.search>>;
  try {
    remote = await client.search(config.qdrantCollection, {
      vector: params.vector,
      limit: params.limit,
      with_payload: true,
      filter: {
        must: [{ key: "visitorId", match: { value: params.visitorId } }],
      },
    });
  } catch {
    return localResults;
  }

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
