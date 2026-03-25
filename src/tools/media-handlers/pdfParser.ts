/**
 * @file pdfParser.ts
 * @description PDF parsing and text extraction for the DEL.
 */
import pdfParse from 'pdf-parse';
import { readFileSync } from 'fs';

export interface PdfParseResult {
  text: string;
  numpages: number;
  info: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export async function parsePdf(pdfPath: string): Promise<PdfParseResult> {
  const buffer = readFileSync(pdfPath);
  const data = await pdfParse(buffer);
  return { text: data.text, numpages: data.numpages, info: data.info as Record<string, unknown>, metadata: data.metadata as Record<string, unknown> };
}

export async function parsePdfBuffer(buffer: Buffer): Promise<PdfParseResult> {
  const data = await pdfParse(buffer);
  return { text: data.text, numpages: data.numpages, info: data.info as Record<string, unknown> };
}

export default { parsePdf, parsePdfBuffer };
