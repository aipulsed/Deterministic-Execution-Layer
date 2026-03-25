/**
 * @file jsonMinifier.ts
 * @description Minifier for JavaScripton
 */

export function minifyJson(json: string): string {
  return JSON.stringify(JSON.parse(json));
}
export default { minifyJson };
