/**
 * @file summarizeDocument.ts
 * @description Documents pipeline step: summarizeDocument
 */

export interface SummaryResult { summary: string; keyPoints: string[]; wordCount: number; estimatedReadTime: number; }
export async function summarizeDocument(content: string, maxSentences = 5): Promise<SummaryResult> {
  const sentences = content.match(/[^.!?]+[.!?]+/g) ?? [];
  const keyPoints = sentences.slice(0, maxSentences).map((s) => s.trim());
  const summary = keyPoints.join(" ");
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const estimatedReadTime = Math.ceil(wordCount / 200);
  return { summary, keyPoints, wordCount, estimatedReadTime };
}
export default { summarizeDocument };
