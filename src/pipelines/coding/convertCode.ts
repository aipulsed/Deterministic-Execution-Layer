/**
 * @file convertCode.ts
 * @description Pipeline step: convertCode
 */

import { transpileJs } from "../../tools/compilers/jsCompiler";
export async function convertCode(code: string, from: string, to: string): Promise<string> {
  if ((from === "typescript" || from === "javascript") && to === "commonjs") return transpileJs(code, { format: "cjs" });
  if ((from === "typescript" || from === "javascript") && to === "esm") return transpileJs(code, { format: "esm" });
  return code;
}
export default { convertCode };
