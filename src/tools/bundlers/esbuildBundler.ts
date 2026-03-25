/**
 * @file esbuildBundler.ts
 * @description esbuild bundler wrapper for the DEL.
 */
import { buildSync, BuildOptions, BuildResult } from 'esbuild';
export interface EsbuildBundleOptions {
  entryPoints: string[];
  outfile?: string;
  outdir?: string;
  bundle?: boolean;
  minify?: boolean;
  sourcemap?: boolean;
  platform?: 'node' | 'browser' | 'neutral';
  format?: 'cjs' | 'esm' | 'iife';
  target?: string;
  external?: string[];
}
export function bundleWithEsbuild(options: EsbuildBundleOptions): BuildResult {
  return buildSync({
    entryPoints: options.entryPoints,
    outfile: options.outfile,
    outdir: options.outdir,
    bundle: options.bundle ?? true,
    minify: options.minify ?? false,
    sourcemap: options.sourcemap ?? false,
    platform: options.platform ?? 'node',
    format: options.format ?? 'cjs',
    target: options.target ?? 'es2022',
    external: options.external,
    logLevel: 'silent',
  } as BuildOptions);
}
export default { bundleWithEsbuild };
