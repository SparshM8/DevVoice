import { NextResponse } from "next/server";
import { listSessionSummaries } from "@/lib/memory-store";

export function GET() {
  return NextResponse.json({ sessions: listSessionSummaries() });
}
