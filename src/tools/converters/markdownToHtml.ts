/**
 * @file markdownToHtml.ts
 * @description Converts Markdown to HTML using the marked library.
 */
import { marked } from 'marked';
export function markdownToHtml(markdown: string): string {
  return marked(markdown) as string;
}
export default { markdownToHtml };
