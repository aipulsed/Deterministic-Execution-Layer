/**
 * @file wasmMinifier.ts
 * @description Minifier for WebAssembly
 */

import { readFileSync, writeFileSync } from "fs";
export function minifyWasm(inputPath: string, outputPath: string): void {
  // In production: use wasm-opt for size optimization
  // This copies the WASM file as-is (wasm-opt must be installed separately)
  writeFileSync(outputPath, readFileSync(inputPath));
}
export default { minifyWasm };
