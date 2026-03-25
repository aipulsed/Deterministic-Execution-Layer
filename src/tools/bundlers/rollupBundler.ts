/**
 * @file rollupBundler.ts
 * @description Rollup bundler wrapper for the DEL.
 */
import { execSync } from 'child_process';
export interface RollupBundleOptions {
  input: string;
  output: string;
  format?: 'cjs' | 'esm' | 'umd' | 'iife';
  name?: string;
}
export function bundleWithRollup(options: RollupBundleOptions): { success: boolean; errors?: string[] } {
  const format = options.format ?? 'cjs';
  const nameFlag = options.name ? `--name "${options.name}"` : '';
  try {
    execSync(`npx rollup "${options.input}" --file "${options.output}" --format ${format} ${nameFlag}`, { stdio: 'inherit' });
    return { success: true };
  } catch (err) {
    return { success: false, errors: [err instanceof Error ? err.message : String(err)] };
  }
}
export default { bundleWithRollup };
