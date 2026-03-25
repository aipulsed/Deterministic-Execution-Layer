/**
 * @file docxParser.ts
 * @description DOCX file parser using mammoth for text and HTML extraction.
 */
import mammoth from 'mammoth';
import { readFileSync } from 'fs';

export interface DocxParseResult {
  text: string;
  html: string;
  messages: Array<{ type: string; message: string }>;
}

export async function parseDocx(filePath: string): Promise<DocxParseResult> {
  const buffer = readFileSync(filePath);
  const [textResult, htmlResult] = await Promise.all([
    mammoth.extractRawText({ buffer }),
    mammoth.convertToHtml({ buffer }),
  ]);
  return { text: textResult.value, html: htmlResult.value, messages: htmlResult.messages };
}

export async function parseDocxBuffer(buffer: Buffer): Promise<DocxParseResult> {
  const [textResult, htmlResult] = await Promise.all([
    mammoth.extractRawText({ buffer }),
    mammoth.convertToHtml({ buffer }),
  ]);
  return { text: textResult.value, html: htmlResult.value, messages: htmlResult.messages };
}

export default { parseDocx, parseDocxBuffer };
