/**
 * @file extractMetadata.ts
 * @description Documents pipeline step: extractMetadata
 */

import * as fs from "fs";
import * as path from "path";
export interface DocumentMetadata { filename: string; extension: string; sizeBytes: number; createdAt: Date; modifiedAt: Date; mimeType?: string; }
export async function extractMetadata(filePath: string): Promise<DocumentMetadata> {
  const stat = fs.statSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mimeMap: Record<string, string> = { ".pdf": "application/pdf", ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", ".txt": "text/plain", ".csv": "text/csv", ".json": "application/json" };
  return { filename: path.basename(filePath), extension: ext, sizeBytes: stat.size, createdAt: stat.birthtime, modifiedAt: stat.mtime, mimeType: mimeMap[ext] };
}
export default { extractMetadata };
