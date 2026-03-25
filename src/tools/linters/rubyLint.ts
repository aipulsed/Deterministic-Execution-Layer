/**
 * @file rubyLint.ts
 * @description Ruby linting via RuboCop using child_process
 */

import { execSync } from "child_process";
export interface RubyLintResult { file: string; offenses: RubyOffense[]; }
export interface RubyOffense { line: number; col: number; severity: string; message: string; cop: string; }
export function lintRuby(file: string): RubyLintResult {
  try {
    const output = execSync(`rubocop --format json "${file}"`, { encoding: "utf-8" });
    const parsed = JSON.parse(output) as { files: Array<{ path: string; offenses: Array<{ location: { line: number; column: number }; severity: string; message: string; cop_name: string }> }> };
    const f = parsed.files[0];
    return { file, offenses: f.offenses.map((o) => ({ line: o.location.line, col: o.location.column, severity: o.severity, message: o.message, cop: o.cop_name })) };
  } catch { return { file, offenses: [] }; }
}
export default { lintRuby };
