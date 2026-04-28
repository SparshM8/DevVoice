import { randomUUID } from "crypto";
import { z } from "zod";
import { appendTurn, ensureSession, getSessionTurns } from "@/lib/memory-store";
import { generateDeveloperResponseStream } from "@/lib/llm";
import { retrieveRelevantContext } from "@/lib/rag";
import { checkRateLimit, getRequestMeta, jsonResponse, logApiError } from "@/lib/api";

export const runtime = "nodejs";

const ChatPayloadSchema = z.object({
  message: z.string().trim().min(1, "Message is required.").max(4000, "Message is too long."),
  sessionId: z.string().trim().max(128).optional(),
});

export async function POST(request: Request) {
  const meta = getRequestMeta(request, "api/chat");

  const limiter = checkRateLimit({
    key: `chat:${meta.ip}`,
    limit: 30,
    windowMs: 60_000,
  });

  if (!limiter.allowed) {
    return jsonResponse(
      {
        error: "Rate limit exceeded. Please retry shortly.",
        requestId: meta.requestId,
      },
      { status: 429, requestId: meta.requestId, headers: limiter.headers }
    );
  }

  try {
    let rawPayload: unknown;
    try {
      rawPayload = await request.json();
    } catch {
      return jsonResponse(
        { error: "Invalid JSON payload.", requestId: meta.requestId },
        { status: 400, requestId: meta.requestId, headers: limiter.headers }
      );
    }

    const parsed = ChatPayloadSchema.safeParse(rawPayload);
    if (!parsed.success) {
      return jsonResponse(
        {
          error: parsed.error.issues[0]?.message ?? "Invalid request payload.",
          requestId: meta.requestId,
        },
        { status: 400, requestId: meta.requestId, headers: limiter.headers }
      );
    }

    const { message, sessionId } = parsed.data;
    const session = ensureSession(sessionId, message);

    const userTurn = {
      id: randomUUID(),
      role: "user" as const,
      content: message,
      createdAt: new Date().toISOString(),
    };
    appendTurn(session.id, userTurn);

    const contexts = await retrieveRelevantContext(message);
    const history = getSessionTurns(session.id);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Send initial metadata
        const metadata = {
          sessionId: session.id,
          contexts,
          suggestions: [] as string[],
        };
        controller.enqueue(encoder.encode(`event: metadata\ndata: ${JSON.stringify(metadata)}\n\n`));

        let fullAnswer = "";
        try {
          const generator = generateDeveloperResponseStream({ message, history, context: contexts });
          while (true) {
            const { value, done } = await generator.next();
            if (done) {
              if (value && value.suggestions) {
                controller.enqueue(encoder.encode(`event: suggestions\ndata: ${JSON.stringify(value.suggestions)}\n\n`));
              }
              break;
            }
            if (value) {
              if (typeof value === "object" && value.type === "action") {
                controller.enqueue(encoder.encode(`event: action\ndata: ${JSON.stringify(value.message)}\n\n`));
              } else if (typeof value === "string") {
                fullAnswer += value;
                controller.enqueue(encoder.encode(`event: text\ndata: ${JSON.stringify(value)}\n\n`));
              }
            }
          }
        } catch (err) {
          controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify(err instanceof Error ? err.message : "Error")}\n\n`));
        }

        const assistantTurn = {
          id: randomUUID(),
          role: "assistant" as const,
          content: fullAnswer,
          createdAt: new Date().toISOString(),
        };
        appendTurn(session.id, assistantTurn);

        controller.enqueue(encoder.encode(`event: end\ndata: {}\n\n`));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        ...limiter.headers,
      },
    });
  } catch (error) {
    logApiError({ requestId: meta.requestId, route: meta.route, error });
    return jsonResponse(
      {
        error: "Failed to process chat request.",
        requestId: meta.requestId,
      },
      { status: 500, requestId: meta.requestId, headers: limiter.headers }
    );
  }
}
