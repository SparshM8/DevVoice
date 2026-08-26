import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { parseFileContent } from "@/lib/file-parser";

describe("file parser", () => {
  it("extracts text from a valid PDF using the server worker", async () => {
    const data = await readFile(new URL("./fixtures/valid-text.pdf", import.meta.url));
    const file = new File([data], "valid-text.pdf", { type: "application/pdf" });
    const parsed = await parseFileContent(file);

    expect(parsed.type).toBe("pdf");
    expect(parsed.text).toContain("DevVoice PDF compatibility fixture");
    expect(parsed.text).toContain("synthetic document");
  });
});
