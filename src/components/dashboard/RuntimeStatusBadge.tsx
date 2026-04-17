"use client";

import { useEffect, useState } from "react";

type StatusPayload = {
  runtimeMode: "mock" | "external";
  qdrantConfigured: boolean;
  message: string;
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

  const isMock = status.runtimeMode === "mock";

  return (
    <div
      className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
        isMock
          ? "border-amber-700/60 bg-amber-950/30 text-amber-100"
          : "border-emerald-700/60 bg-emerald-950/30 text-emerald-100"
      }`}
    >
      <p className="font-medium">{isMock ? "Mock Mode Active" : "External LLM Mode Active"}</p>
      <p className="mt-1 opacity-90">{status.message}</p>
      <p className="mt-1 text-xs opacity-80">
        Qdrant: {status.qdrantConfigured ? "configured" : "local fallback"}
      </p>
    </div>
  );
}
