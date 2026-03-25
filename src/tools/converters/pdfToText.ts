/**
 * @file pdfToText.ts
 * @description Converts PDF files to plain text using pdf-parse.
 */
import pdfParse from 'pdf-parse';
import { readFileSync } from 'fs';
export async function pdfToText(pdfPath: string): Promise<string> {
  const buffer = readFileSync(pdfPath);
  const data = await pdfParse(buffer);
  return data.text;
}
export async function pdfBufferToText(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text;
}
export default { pdfToText, pdfBufferToText };
