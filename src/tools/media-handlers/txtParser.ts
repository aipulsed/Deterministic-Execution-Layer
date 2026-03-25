/**
 * @file txtParser.ts
 * @description Text file parser with line/paragraph extraction.
 */
import { readFileSync } from 'fs';

export interface TxtParseResult {
  content: string;
  lines: string[];
  wordCount: number;
  charCount: number;
}

export function parseTxt(filePath: string, encoding: BufferEncoding = 'utf-8'): TxtParseResult {
  const content = readFileSync(filePath, { encoding });
  const lines = content.split('\n');
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  return { content, lines, wordCount, charCount: content.length };
}

export function parseTxtContent(content: string): TxtParseResult {
  const lines = content.split('\n');
  return { content, lines, wordCount: content.split(/\s+/).filter(Boolean).length, charCount: content.length };
}

export default { parseTxt, parseTxtContent };
