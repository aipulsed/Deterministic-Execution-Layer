/**
 * @file svgMinifier.ts
 * @description Minifier for SVG
 */

export function minifySvg(svg: string): string {
  return svg.replace(/<!--[\s\S]*?-->/g, "").replace(/\s*([\/<>{}=])\s*/g, "$1").replace(/\s+/g, " ").trim();
}
export default { minifySvg };
