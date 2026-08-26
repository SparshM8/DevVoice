"use client";

import { useEffect, useState } from "react";

type ExternalLlmHealth = "not_configured" | "unverified" | "healthy" | "degraded";

type StatusPayload = {
  runtimeMode: "mock" | "external";
  qdrantConfigured: boolean;
  message: string;
  externalLlmHealth?: {
    status: ExternalLlmHealth;
    error?: string;
    checkedAt?: string;
  };
};

export function RuntimeStatusBadge() {
  const [status, setStatus] = useState<StatusPayload | null>(null);

  useEffect(() => {
    void fetch("/api/status")
      .then((res) => res.json())
      .then((data: StatusPayload) => setStatus(data))
      .catch(() => setStatus(null));
  }, []);

  if (!status) {
    return null;
  }

  const health = status.externalLlmHealth?.status ?? (status.runtimeMode === "mock" ? "not_configured" : "unverified");
  const isHealthy = health === "healthy";
  const isDegraded = health === "degraded";
  const isMock = health === "not_configured";
  const headline = isHealthy
    ? "External LLM Ready"
    : isDegraded
      ? "External LLM Degraded — Mock Fallback Active"
      : health === "unverified"
        ? "External LLM Configured — Not Verified"
        : "Mock Mode Active";
  const tone = isHealthy
    ? "border-emerald-700/60 bg-emerald-950/30 text-emerald-100"
    : isMock
      ? "border-amber-700/60 bg-amber-950/30 text-amber-100"
      : "border-orange-700/60 bg-orange-950/30 text-orange-100";

  return (
    <div role="status" className={`mb-4 rounded-xl border px-4 py-3 text-sm ${tone}`}>
      <p className="font-medium">{headline}</p>
      <p className="mt-1 opacity-90">{status.message}</p>
      <p className="mt-1 text-xs opacity-80">
        Qdrant: {status.qdrantConfigured ? "configured" : "local fallback"}
        {status.externalLlmHealth?.error ? ` · ${status.externalLlmHealth.error}` : ""}
      </p>
    </div>
  );
}
