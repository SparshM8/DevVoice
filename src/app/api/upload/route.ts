import { parseFileContent } from "@/lib/file-parser";
import { ingestKnowledge } from "@/lib/rag";
import { validateUpload } from "@/lib/upload-validation";
import { checkRateLimit, getRequestMeta, jsonResponse, logApiError } from "@/lib/api";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const meta = getRequestMeta(request, "api/upload");

  const limiter = checkRateLimit({
    key: `upload:${meta.ip}`,
    limit: 10,
    windowMs: 5 * 60_000,
  });

  if (!limiter.allowed) {
    return jsonResponse(
      {
        error: "Upload rate limit exceeded. Please retry later.",
        requestId: meta.requestId,
      },
      { status: 429, requestId: meta.requestId, headers: limiter.headers, visitorCookie: meta.visitorCookie }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return jsonResponse(
        { error: "No file provided.", requestId: meta.requestId },
        { status: 400, requestId: meta.requestId, headers: limiter.headers, visitorCookie: meta.visitorCookie }
      );
    }

    const validation = validateUpload(file);
    if (!validation.ok) {
      return jsonResponse(
        { error: validation.message, requestId: meta.requestId },
        { status: validation.status, requestId: meta.requestId, headers: limiter.headers }
      );
    }

    const parsed = await parseFileContent(file);
    const result = await ingestKnowledge({
      source: file.name,
      type: parsed.type,
      text: parsed.text,
      visitorId: meta.visitorId,
    });

    return jsonResponse(
      {
        requestId: meta.requestId,
        fileName: file.name,
        chunksStored: result.chunksCreated,
        chunksRequested: result.chunksStored,
      },
      { requestId: meta.requestId, headers: limiter.headers, visitorCookie: meta.visitorCookie }
    );
  } catch (error) {
    logApiError({ requestId: meta.requestId, route: meta.route, error });
    return jsonResponse(
      {
        error: "Failed to upload or index file.",
        requestId: meta.requestId,
      },
      { status: 500, requestId: meta.requestId, headers: limiter.headers, visitorCookie: meta.visitorCookie }
    );
  }
}
