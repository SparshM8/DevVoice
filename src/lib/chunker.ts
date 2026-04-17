export function chunkText(content: string, maxChars = 900, overlap = 120): string[] {
  const text = content.replace(/\r/g, "").trim();
  if (!text) return [];

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + maxChars, text.length);
    const slice = text.slice(start, end);
    chunks.push(slice.trim());
    if (end === text.length) break;
    start = Math.max(0, end - overlap);
  }

  return chunks.filter(Boolean);
}
