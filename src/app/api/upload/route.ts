import { NextResponse } from "next/server";
import { parseFileContent } from "@/lib/file-parser";
import { ingestKnowledge } from "@/lib/rag";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const parsed = await parseFileContent(file);
    const result = await ingestKnowledge({
      source: file.name,
      type: parsed.type,
      text: parsed.text,
    });

    return NextResponse.json({
      fileName: file.name,
      chunksStored: result.chunksStored,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to upload or index file.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
