/**
 * @file convertDocument.ts
 * @description Documents pipeline step: convertDocument
 */

import { parseDocument } from "./parseDocument";
import * as fs from "fs";
export async function convertDocument(inputPath: string, outputFormat: "txt" | "json" | "html"): Promise<string> {
  const parsed = await parseDocument(inputPath);
  if (outputFormat === "txt") return parsed.content;
  if (outputFormat === "json") return JSON.stringify({ content: parsed.content, format: parsed.format, metadata: parsed.metadata }, null, 2);
  if (outputFormat === "html") return `<html><body><pre>${parsed.content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre></body></html>`;
  throw new Error(`Unsupported output format: ${outputFormat}`);
}
export default { convertDocument };
