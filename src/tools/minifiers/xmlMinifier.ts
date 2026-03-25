/**
 * @file xmlMinifier.ts
 * @description Minifier for XML
 */

export function minifyXml(xml: string): string {
  return xml.replace(/>\s+</g, "><").replace(/<!--[\s\S]*?-->/g, "").replace(/\s{2,}/g, " ").trim();
}
export default { minifyXml };
