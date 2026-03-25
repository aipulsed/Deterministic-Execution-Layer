/**
 * @file bundleCode.ts
 * @description Pipeline step: bundleCode
 */

import { bundleWithEsbuild } from "../../tools/bundlers/esbuildBundler";
export async function bundleCode(entryPoints: string[], outfile: string, options: { minify?: boolean; platform?: "node" | "browser" } = {}) {
  try {
    bundleWithEsbuild({ entryPoints, outfile, bundle: true, minify: options.minify, platform: options.platform ?? "node" });
    return { success: true, outfile };
  } catch (err) {
    return { success: false, errors: [err instanceof Error ? err.message : String(err)] };
  }
}
export default { bundleCode };
