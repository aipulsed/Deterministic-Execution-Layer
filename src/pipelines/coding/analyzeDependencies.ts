/**
 * @file analyzeDependencies.ts
 * @description Pipeline step: analyzeDependencies
 */

import { execSync } from "child_process";
export async function analyzeDependencies(projectDir: string): Promise<{ packages: string[]; vulnerable: string[]; outdated: string[] }> {
  try {
    const list = execSync("npm list --json --depth=0", { cwd: projectDir, encoding: "utf-8" });
    const deps = JSON.parse(list) as { dependencies?: Record<string, unknown> };
    return { packages: Object.keys(deps.dependencies ?? {}), vulnerable: [], outdated: [] };
  } catch { return { packages: [], vulnerable: [], outdated: [] }; }
}
export default { analyzeDependencies };
