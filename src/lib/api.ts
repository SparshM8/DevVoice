import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

type RateBucket = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  headers: Record<string, string>;
};

const rateBuckets = new Map<string, RateBucket>();

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}

export function getRequestMeta(request: Request, route: string) {
  return {
    requestId: randomUUID(),
    ip: getClientIp(request),
    route,
  };
}

function buildRateHeaders(limit: number, remaining: number, resetAt: number): Record<string, string> {
  return {
    "x-ratelimit-limit": String(limit),
    "x-ratelimit-remaining": String(remaining),
    "x-ratelimit-reset": String(Math.ceil(resetAt / 1000)),
  };
}

export function checkRateLimit(params: {
  key: string;
  limit: number;
  windowMs: number;
}): RateLimitResult {
  const now = Date.now();
  const bucket = rateBuckets.get(params.key);

  if (!bucket || now > bucket.resetAt) {
    const resetAt = now + params.windowMs;
    rateBuckets.set(params.key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: params.limit - 1,
      resetAt,
      headers: buildRateHeaders(params.limit, params.limit - 1, resetAt),
    };
  }

  if (bucket.count >= params.limit) {
    const headers = buildRateHeaders(params.limit, 0, bucket.resetAt);
    headers["retry-after"] = String(Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)));

    return {
      allowed: false,
      remaining: 0,
      resetAt: bucket.resetAt,
      headers,
    };
  }

  bucket.count += 1;
  rateBuckets.set(params.key, bucket);

  const remaining = params.limit - bucket.count;
  return {
    allowed: true,
    remaining,
    resetAt: bucket.resetAt,
    headers: buildRateHeaders(params.limit, remaining, bucket.resetAt),
  };
}

export function jsonResponse<T>(
  body: T,
  options?: {
    status?: number;
    requestId?: string;
    headers?: Record<string, string>;
  }
) {
  const response = NextResponse.json(body, { status: options?.status ?? 200 });

  if (options?.requestId) {
    response.headers.set("x-request-id", options.requestId);
  }

  if (options?.headers) {
    for (const [name, value] of Object.entries(options.headers)) {
      response.headers.set(name, value);
    }
  }

  return response;
}

export function logApiError(params: {
  requestId: string;
  route: string;
  error: unknown;
}) {
  const message = params.error instanceof Error ? params.error.message : "Unknown error";
  console.error(`[${params.route}] requestId=${params.requestId} error=${message}`);
}
