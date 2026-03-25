/**
 * @file testCode.ts
 * @description Pipeline step: testCode
 */

import { execSync } from "child_process";
export async function testCode(options: { configPath?: string; coverage?: boolean } = {}): Promise<{ success: boolean; output: string }> {
  const coverage = options.coverage ? "--coverage" : "";
  const config = options.configPath ? `--config ${options.configPath}` : "";
  try {
    const output = execSync(`npx vitest run ${config} ${coverage}`, { encoding: "utf-8" });
    return { success: true, output };
  } catch (err: unknown) {
    return { success: false, output: (err as { stdout?: string }).stdout ?? "" };
  }
}
export default { testCode };
