import { describe, expect, it } from "vitest";
import { validateUpload } from "@/lib/upload-validation";

describe("upload validation", () => {
  it("accepts supported non-empty files", () => {
    expect(validateUpload({ name: "notes.md", size: 12 })).toEqual({ ok: true, extension: "md" });
  });

  it("rejects unsupported files before parsing", () => {
    expect(validateUpload({ name: "payload.exe", size: 12 })).toEqual({
      ok: false,
      status: 400,
      message: "Unsupported file type .exe.",
    });
  });

  it("rejects empty supported files", () => {
    expect(validateUpload({ name: "empty.txt", size: 0 })).toEqual({
      ok: false,
      status: 400,
      message: "File is empty. Add some content before uploading.",
    });
  });

  it("rejects files over the 5 MB limit", () => {
    expect(validateUpload({ name: "large.log", size: 5 * 1024 * 1024 + 1 })).toEqual({
      ok: false,
      status: 413,
      message: "File too large. Max size is 5MB.",
    });
  });
});
