import { jsonResponse } from "@/lib/api";

export const runtime = "nodejs";

export function GET() {
  return jsonResponse({
    ok: true,
    service: "devvoice-api",
    timestamp: new Date().toISOString(),
  });
}
