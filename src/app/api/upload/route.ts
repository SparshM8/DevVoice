import { parseFileContent } from "@/lib/file-parser";
import { ingestKnowledge } from "@/lib/rag";
import { checkRateLimit, getRequestMeta, jsonResponse, logApiError } from "@/lib/api";

export const runtime = "nodejs";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([
  "txt",
  "md",
  "pdf",
  "json",
  "js",
  "jsx",
  "ts",
  "tsx",
  "py",
  "java",
  "go",
  "log",
]);

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
      { status: 429, requestId: meta.requestId, headers: limiter.headers }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return jsonResponse(
        { error: "No file provided.", requestId: meta.requestId },
        { status: 400, requestId: meta.requestId, headers: limiter.headers }
      );
    }

    const extension = file.name.toLowerCase().split(".").pop() ?? "";
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      return jsonResponse(
        {
          error: `Unsupported file type .${extension || "unknown"}.`,
          requestId: meta.requestId,
        },
        { status: 400, requestId: meta.requestId, headers: limiter.headers }
      );
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return jsonResponse(
        {
          error: `File too large. Max size is ${Math.floor(MAX_UPLOAD_BYTES / (1024 * 1024))}MB.`,
          requestId: meta.requestId,
        },
        { status: 413, requestId: meta.requestId, headers: limiter.headers }
      );
    }

    const parsed = await parseFileContent(file);
    const result = await ingestKnowledge({
      source: file.name,
      type: parsed.type,
      text: parsed.text,
    });

    return jsonResponse(
      {
        requestId: meta.requestId,
        fileName: file.name,
        chunksStored: result.chunksStored,
      },
      { requestId: meta.requestId, headers: limiter.headers }
    );
  } catch (error) {
    logApiError({ requestId: meta.requestId, route: meta.route, error });
    return jsonResponse(
      {
        error: "Failed to upload or index file.",
        requestId: meta.requestId,
      },
      { status: 500, requestId: meta.requestId, headers: limiter.headers }
    );
  }
}
