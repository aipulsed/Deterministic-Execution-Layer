/**
 * @file markdownFormatter.ts
 * @description Markdown formatter for consistent style
 */

export function formatMarkdown(md: string): string {
  return md.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").replace(/[ \t]+$/gm, "").trim() + "\n";
}
export function normalizeHeadings(md: string): string {
  return md.replace(/^(#{1,6})\s*(.+)$/gm, (_, hashes, text) => `${hashes} ${text.trim()}`);
}
export default { formatMarkdown, normalizeHeadings };
