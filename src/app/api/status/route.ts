import { NextResponse } from "next/server";
import { config, getRuntimeMode, hasExternalLlmConfig, hasQdrantConfig } from "@/lib/config";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json({
    appName: config.appName,
    runtimeMode: getRuntimeMode(),
    mockMode: config.mockMode,
    externalLlmConfigured: hasExternalLlmConfig(),
    qdrantConfigured: hasQdrantConfig(),
    message: hasExternalLlmConfig()
      ? "External LLM mode is active."
      : "Mock mode is active. You can demo without Gemini/OpenAI keys.",
  });
}
