import { config, getRuntimeMode, hasExternalLlmConfig, hasQdrantConfig } from "@/lib/config";
import { getExternalLlmHealth } from "@/lib/llm-health";
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

  const externalLlmConfigured = hasExternalLlmConfig();
  const externalLlmHealth = getExternalLlmHealth(externalLlmConfigured);
  const effectiveMockMode = config.mockMode || externalLlmHealth.status === "degraded";

  return jsonResponse(
    {
      requestId: meta.requestId,
      appName: config.appName,
      runtimeMode: effectiveMockMode ? "mock" : getRuntimeMode(),
      mockMode: effectiveMockMode,
      externalLlmConfigured,
      externalLlmHealth,
      qdrantConfigured: hasQdrantConfig(),
      timestamp: new Date().toISOString(),
      message:
        externalLlmHealth.status === "healthy"
          ? "External LLM mode is active."
          : externalLlmHealth.status === "degraded"
            ? "External LLM is degraded. Mock fallback is active."
            : externalLlmHealth.status === "unverified"
              ? "External LLM is configured but not yet verified."
              : "Mock mode is active. You can demo without Gemini/OpenAI keys.",
    },
    { requestId: meta.requestId, headers: limiter.headers }
  );
}
