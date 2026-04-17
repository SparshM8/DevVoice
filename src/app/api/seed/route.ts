import { NextResponse } from "next/server";
import { ingestKnowledge } from "@/lib/rag";
import { seedContexts } from "@/lib/seed-contexts";

export const runtime = "nodejs";

export async function POST() {
  let total = 0;
  for (const doc of seedContexts) {
    const result = await ingestKnowledge(doc);
    total += result.chunksStored;
  }

  return NextResponse.json({ seededDocuments: seedContexts.length, chunksStored: total });
}
