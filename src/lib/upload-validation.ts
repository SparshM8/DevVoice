export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export const ALLOWED_EXTENSIONS = new Set([
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

export type UploadValidationResult =
  | { ok: true; extension: string }
  | { ok: false; status: 400 | 413; message: string };

export function validateUpload(file: { name: string; size: number }): UploadValidationResult {
  const extension = file.name.toLowerCase().split(".").pop() ?? "";

  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return {
      ok: false,
      status: 400,
      message: `Unsupported file type .${extension || "unknown"}.`,
    };
  }

  if (file.size === 0) {
    return {
      ok: false,
      status: 400,
      message: "File is empty. Add some content before uploading.",
    };
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      status: 413,
      message: `File too large. Max size is ${Math.floor(MAX_UPLOAD_BYTES / (1024 * 1024))}MB.`,
    };
  }

  return { ok: true, extension };
}
