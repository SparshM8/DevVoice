import { createHmac, randomUUID, timingSafeEqual } from "crypto";
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

type RequestMeta = {
  requestId: string;
  ip: string;
  route: string;
  visitorId: string;
  visitorCookie?: string;
};

const rateBuckets = new Map<string, RateBucket>();
const visitorCookieName = "devvoice_visitor";
const visitorCookieMaxAge = 60 * 60 * 24 * 365;
const visitorSecret = process.env.DEVVOICE_VISITOR_SECRET?.trim() || randomUUID();

function signVisitorId(visitorId: string): string {
  return createHmac("sha256", visitorSecret).update(visitorId).digest("base64url");
}

function isValidVisitorId(visitorId: string, signature: string): boolean {
  if (!/^[0-9a-f-]{36}$/i.test(visitorId) || !signature) return false;
  const expected = Buffer.from(signVisitorId(visitorId));
  const actual = Buffer.from(signature);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get("cookie");
  if (!header) return undefined;
  const match = header.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return match?.slice(name.length + 1);
}

function buildVisitorCookie(visitorId: string, request: Request): string {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${visitorCookieName}=${visitorId}.${signVisitorId(visitorId)}; Path=/; Max-Age=${visitorCookieMaxAge}; HttpOnly; SameSite=Lax${secure}`;
}

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

export function getRequestMeta(request: Request, route: string): RequestMeta {
  const rawVisitor = readCookie(request, visitorCookieName);
  const [visitorId, signature] = rawVisitor?.split(".") ?? [];
  const valid = Boolean(visitorId && signature && isValidVisitorId(visitorId, signature));
  const resolvedVisitorId = valid ? visitorId : randomUUID();

  return {
    requestId: randomUUID(),
    ip: getClientIp(request),
    route,
    visitorId: resolvedVisitorId,
    visitorCookie: valid ? undefined : buildVisitorCookie(resolvedVisitorId, request),
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
    visitorCookie?: string;
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

  if (options?.visitorCookie) {
    response.headers.set("Set-Cookie", options.visitorCookie);
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
