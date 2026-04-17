import { listSessionSummaries } from "@/lib/memory-store";
import { checkRateLimit, getRequestMeta, jsonResponse, logApiError } from "@/lib/api";

export const runtime = "nodejs";

export function GET(request: Request) {
  const meta = getRequestMeta(request, "api/history");

  const limiter = checkRateLimit({
    key: `history:${meta.ip}`,
    limit: 60,
    windowMs: 60_000,
  });

  if (!limiter.allowed) {
    return jsonResponse(
      { error: "Rate limit exceeded.", requestId: meta.requestId },
      { status: 429, requestId: meta.requestId, headers: limiter.headers }
    );
  }

  try {
    return jsonResponse(
      {
        requestId: meta.requestId,
        sessions: listSessionSummaries(),
      },
      { requestId: meta.requestId, headers: limiter.headers }
    );
  } catch (error) {
    logApiError({ requestId: meta.requestId, route: meta.route, error });
    return jsonResponse(
      {
        error: "Failed to load session history.",
        requestId: meta.requestId,
      },
      { status: 500, requestId: meta.requestId, headers: limiter.headers }
    );
  }
}
