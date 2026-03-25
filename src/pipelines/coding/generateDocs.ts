/**
 * @file generateDocs.ts
 * @description Pipeline step: generateDocs
 */

import { execSync } from "child_process";
export async function generateDocs(srcDir: string, outputDir = "docs"): Promise<{ success: boolean; outputDir: string }> {
  try {
    execSync(`npx typedoc --out "${outputDir}" "${srcDir}"`, { stdio: "ignore" });
    return { success: true, outputDir };
  } catch (err) {
    return { success: false, outputDir };
  }
}
export default { generateDocs };
