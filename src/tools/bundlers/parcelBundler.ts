/**
 * @file parcelBundler.ts
 * @description Parcel bundler wrapper for the DEL.
 */
import { execSync } from 'child_process';
export function bundleWithParcel(entry: string, outDir = 'dist', options: { mode?: 'development' | 'production' } = {}): { success: boolean; errors?: string[] } {
  const mode = options.mode ?? 'production';
  try {
    execSync(`npx parcel build "${entry}" --dist-dir "${outDir}" --${mode}`, { stdio: 'inherit' });
    return { success: true };
  } catch (err) {
    return { success: false, errors: [err instanceof Error ? err.message : String(err)] };
  }
}
export default { bundleWithParcel };
