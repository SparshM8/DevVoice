import { ingestKnowledge } from "@/lib/rag";
import { seedContexts } from "@/lib/seed-contexts";
import { checkRateLimit, getRequestMeta, jsonResponse, logApiError } from "@/lib/api";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const meta = getRequestMeta(request, "api/seed");

  const limiter = checkRateLimit({
    key: `seed:${meta.ip}`,
    limit: 5,
    windowMs: 10 * 60_000,
  });

  if (!limiter.allowed) {
    return jsonResponse(
      {
        error: "Seed endpoint rate limit exceeded.",
        requestId: meta.requestId,
      },
      { status: 429, requestId: meta.requestId, headers: limiter.headers }
    );
  }

  try {
    let total = 0;
    for (const doc of seedContexts) {
      const result = await ingestKnowledge(doc);
      total += result.chunksStored;
    }

    return jsonResponse(
      {
        requestId: meta.requestId,
        seededDocuments: seedContexts.length,
        chunksStored: total,
      },
      { requestId: meta.requestId, headers: limiter.headers }
    );
  } catch (error) {
    logApiError({ requestId: meta.requestId, route: meta.route, error });
    return jsonResponse(
      {
        error: "Failed to seed knowledge base.",
        requestId: meta.requestId,
      },
      { status: 500, requestId: meta.requestId, headers: limiter.headers }
    );
  }
}
