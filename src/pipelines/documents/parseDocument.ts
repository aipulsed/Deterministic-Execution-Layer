/**
 * @file parseDocument.ts
 * @description Documents pipeline step: parseDocument
 */

import * as path from "path";
import { parsePdf } from "../../tools/media-handlers/pdfParser";
import { parseTxt } from "../../tools/media-handlers/txtParser";
import { parseDocx } from "../../tools/media-handlers/docxParser";
export interface ParsedDocument { content: string; format: string; metadata?: Record<string, unknown>; }
export async function parseDocument(filePath: string): Promise<ParsedDocument> {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".pdf") { const r = await parsePdf(filePath); return { content: r.text, format: "pdf", metadata: { pages: r.numpages } }; }
  if (ext === ".docx") { const r = await parseDocx(filePath); return { content: r.text, format: "docx" }; }
  if (ext === ".txt") { const r = parseTxt(filePath); return { content: r.content, format: "txt", metadata: { lines: r.lines.length } }; }
  throw new Error(`Unsupported document format: ${ext}`);
}
export default { parseDocument };
