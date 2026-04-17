import { PDFParse } from "pdf-parse";

const CODE_EXTENSIONS = new Set(["js", "jsx", "ts", "tsx", "py", "java", "go", "rs", "c", "cpp", "log"]);

export async function parseFileContent(file: File): Promise<{ text: string; type: string }> {
  const name = file.name.toLowerCase();
  const extension = name.split(".").pop() ?? "txt";

  if (extension === "pdf") {
    const buffer = Buffer.from(await file.arrayBuffer());
    const parser = new PDFParse({ data: buffer });
    const parsed = await parser.getText();
    await parser.destroy();
    return { text: parsed.text, type: "pdf" };
  }

  const rawText = await file.text();

  if (extension === "json") {
    try {
      const formatted = JSON.stringify(JSON.parse(rawText), null, 2);
      return { text: formatted, type: "json" };
    } catch {
      return { text: rawText, type: "json" };
    }
  }

  if (extension === "md") {
    return { text: rawText, type: "markdown" };
  }

  if (CODE_EXTENSIONS.has(extension)) {
    return { text: rawText, type: "code" };
  }

  return { text: rawText, type: "text" };
}
