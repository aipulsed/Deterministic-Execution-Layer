/**
 * @file runUnitTests.ts
 * @description Pipeline step: runUnitTests
 */

import { execSync } from "child_process";
export async function runUnitTests(pattern?: string): Promise<{ success: boolean; passed: number; failed: number; output: string }> {
  const filter = pattern ? `-- "${pattern}"` : "";
  try {
    const output = execSync(`npx vitest run ${filter} --reporter json`, { encoding: "utf-8" });
    const results = JSON.parse(output) as { numPassedTests?: number; numFailedTests?: number };
    return { success: true, passed: results.numPassedTests ?? 0, failed: results.numFailedTests ?? 0, output };
  } catch (err: unknown) {
    return { success: false, passed: 0, failed: 1, output: (err as { stdout?: string }).stdout ?? "" };
  }
}
export default { runUnitTests };
