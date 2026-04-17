import { config, getRuntimeMode, hasExternalLlmConfig, hasQdrantConfig } from "@/lib/config";
import { checkRateLimit, getRequestMeta, jsonResponse } from "@/lib/api";

export const runtime = "nodejs";

export function GET(request: Request) {
  const meta = getRequestMeta(request, "api/status");

  const limiter = checkRateLimit({
    key: `status:${meta.ip}`,
    limit: 120,
    windowMs: 60_000,
  });

  if (!limiter.allowed) {
    return jsonResponse(
      { error: "Rate limit exceeded.", requestId: meta.requestId },
      { status: 429, requestId: meta.requestId, headers: limiter.headers }
    );
  }

  return jsonResponse(
    {
      requestId: meta.requestId,
      appName: config.appName,
      runtimeMode: getRuntimeMode(),
      mockMode: config.mockMode,
      externalLlmConfigured: hasExternalLlmConfig(),
      qdrantConfigured: hasQdrantConfig(),
      timestamp: new Date().toISOString(),
      message: hasExternalLlmConfig()
        ? "External LLM mode is active."
        : "Mock mode is active. You can demo without Gemini/OpenAI keys.",
    },
    { requestId: meta.requestId, headers: limiter.headers }
  );
}
