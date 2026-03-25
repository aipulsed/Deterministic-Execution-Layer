/**
 * @file prettier.ts
 * @description Prettier code formatting wrapper
 */

import { execSync } from "child_process";
export function formatWithPrettier(code: string, parser: string): string {
  try {
    return execSync(`echo ${JSON.stringify(code)} | npx prettier --parser ${parser}`, { encoding: "utf-8" });
  } catch { return code; }
}
export function formatFileWithPrettier(filePath: string): void {
  execSync(`npx prettier --write "${filePath}"`, { stdio: "ignore" });
}
export default { formatWithPrettier, formatFileWithPrettier };
