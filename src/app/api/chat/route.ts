import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { appendTurn, ensureSession, getSessionTurns } from "@/lib/memory-store";
import { generateDeveloperResponse } from "@/lib/llm";
import { retrieveRelevantContext } from "@/lib/rag";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      message?: string;
      sessionId?: string;
    };

    const message = payload.message?.trim();
    if (!message) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const session = ensureSession(payload.sessionId, message);
    const userTurn = {
      id: randomUUID(),
      role: "user" as const,
      content: message,
      createdAt: new Date().toISOString(),
    };
    appendTurn(session.id, userTurn);

    const contexts = await retrieveRelevantContext(message);
    const history = getSessionTurns(session.id);
    const response = await generateDeveloperResponse({
      message,
      history,
      context: contexts,
    });

    const assistantTurn = {
      id: randomUUID(),
      role: "assistant" as const,
      content: response.answer,
      createdAt: new Date().toISOString(),
    };
    appendTurn(session.id, assistantTurn);

    return NextResponse.json({
      sessionId: session.id,
      answer: response.answer,
      suggestions: response.suggestions,
      contexts,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to process chat request.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
