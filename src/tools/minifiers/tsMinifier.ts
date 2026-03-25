/**
 * @file tsMinifier.ts
 * @description Minifier for TypeScript
 */

import { transformSync } from "esbuild";
export function minifyTs(code: string): string {
  const result = transformSync(code, { minify: true, loader: "ts" });
  return result.code;
}
export default { minifyTs };
