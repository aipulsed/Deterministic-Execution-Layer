/**
 * @file htmlMinifier.ts
 * @description Minifier for HTML
 */

export function minifyHtml(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, "").replace(/>\s+</g, "><").replace(/\s{2,}/g, " ").trim();
}
export default { minifyHtml };
