/**
 * @file wasmCompiler.ts
 * @description Compiler wrapper for wasmCompiler
 */

import { execSync } from "child_process";
export function compileWat(watPath: string, wasmPath: string): void {
  execSync(`wat2wasm "${watPath}" -o "${wasmPath}"`, { stdio: "inherit" });
}
export function compileRustToWasm(crateDir: string): void {
  execSync(`wasm-pack build "${crateDir}" --target web`, { stdio: "inherit" });
}
export default { compileWat, compileRustToWasm };
