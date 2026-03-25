/**
 * @file cssMinifier.ts
 * @description Minifier for CSS
 */

export function minifyCss(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s*([{};:,>~+])\s*/g, "$1").replace(/\s+/g, " ").replace(/;\}/g, "}").trim();
}
export default { minifyCss };
