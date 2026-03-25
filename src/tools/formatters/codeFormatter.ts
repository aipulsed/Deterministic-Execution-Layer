/**
 * @file codeFormatter.ts
 * @description General code formatter dispatching to language-specific formatters
 */

import { execSync } from "child_process";
export function formatCode(code: string, language: string): string {
  const parserMap: Record<string, string> = { typescript: "typescript", javascript: "babel", css: "css", html: "html", json: "json", markdown: "markdown", yaml: "yaml" };
  const parser = parserMap[language.toLowerCase()] ?? "babel";
  try {
    return execSync(`echo ${JSON.stringify(code)} | npx prettier --parser ${parser}`, { encoding: "utf-8" });
  } catch { return code; }
}
export default { formatCode };
