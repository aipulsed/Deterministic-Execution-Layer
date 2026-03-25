/**
 * @file webpackBundler.ts
 * @description Webpack bundler wrapper for the DEL.
 */
import { execSync } from 'child_process';
import * as path from 'path';

export interface WebpackBundleOptions {
  entry: string;
  output: string;
  mode?: 'development' | 'production' | 'none';
  configPath?: string;
}

export interface BundleResult {
  success: boolean;
  outputPath?: string;
  errors?: string[];
}

/**
 * Bundles a project using Webpack.
 * @param options - Bundle options
 * @returns Bundle result
 */
export function bundleWithWebpack(options: WebpackBundleOptions): BundleResult {
  const mode = options.mode ?? 'production';
  const config = options.configPath ? `--config "${options.configPath}"` : '';
  try {
    execSync(
      `npx webpack --mode ${mode} --entry "${path.resolve(options.entry)}" --output-path "${path.resolve(path.dirname(options.output))}" --output-filename "${path.basename(options.output)}" ${config}`,
      { stdio: 'inherit' },
    );
    return { success: true, outputPath: options.output };
  } catch (err) {
    return { success: false, errors: [err instanceof Error ? err.message : String(err)] };
  }
}

export default { bundleWithWebpack };
