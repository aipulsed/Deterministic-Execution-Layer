/**
 * @file htmlToMarkdown.ts
 * @description Converts HTML to Markdown using Turndown.
 */
import TurndownService from 'turndown';
export function htmlToMarkdown(html: string, options: Record<string, unknown> = {}): string {
  const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', ...options });
  return td.turndown(html);
}
export default { htmlToMarkdown };
