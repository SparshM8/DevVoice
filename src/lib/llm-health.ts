export type ExternalLlmHealth = "not_configured" | "unverified" | "healthy" | "degraded";

type HealthSnapshot = {
  status: ExternalLlmHealth;
  error?: string;
  checkedAt?: string;
};

let snapshot: HealthSnapshot = { status: "unverified" };

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export function getExternalLlmHealth(configured: boolean): HealthSnapshot {
  if (!configured) {
    return { status: "not_configured" };
  }

  return snapshot;
}

export function recordExternalLlmSuccess() {
  snapshot = {
    status: "healthy",
    checkedAt: new Date().toISOString(),
  };
}

export function recordExternalLlmFailure(error: unknown) {
  snapshot = {
    status: "degraded",
    error: errorMessage(error).slice(0, 200),
    checkedAt: new Date().toISOString(),
  };
}

export function resetExternalLlmHealth() {
  snapshot = { status: "unverified" };
}
