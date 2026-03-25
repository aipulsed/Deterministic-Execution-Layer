/**
 * @file minifyCode.ts
 * @description Pipeline step: minifyCode
 */

import { minifyJs } from "../../tools/minifiers/jsMinifier";
import { minifyCss } from "../../tools/minifiers/cssMinifier";
import * as path from "path";
import { readFileSync, writeFileSync } from "fs";
export async function minifyCode(filePath: string): Promise<{ success: boolean; originalSize: number; minifiedSize: number }> {
  const ext = path.extname(filePath).toLowerCase();
  const content = readFileSync(filePath, "utf-8");
  let minified = content;
  if (ext === ".js" || ext === ".ts") minified = minifyJs(content);
  else if (ext === ".css") minified = minifyCss(content);
  writeFileSync(filePath, minified, "utf-8");
  return { success: true, originalSize: content.length, minifiedSize: minified.length };
}
export default { minifyCode };
