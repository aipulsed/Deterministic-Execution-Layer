/**
 * @file resolveImports.ts
 * @description Pipeline step: resolveImports
 */

import { readFileSync } from "fs";
export function resolveImports(filePath: string): string[] {
  const content = readFileSync(filePath, "utf-8");
  const imports: string[] = [];
  const regex = /(?:import|require)\s*(?:\(|[^(]*from\s*)["\x27]([^"\x27]+)["\x27]/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(content)) !== null) imports.push(m[1]);
  return [...new Set(imports)];
}
export default { resolveImports };
