/**
 * @file cssFormatter.ts
 * @description CSS formatter with property sorting
 */

export function formatCss(css: string, indent = 2): string {
  const indentStr = " ".repeat(indent);
  let formatted = "";
  let depth = 0;
  const tokens = css.replace(/\{/g, " {\n").replace(/\}/g, "\n}\n").replace(/;/g, ";\n").split("\n");
  for (const line of tokens) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed === "}") { depth = Math.max(0, depth - 1); formatted += indentStr.repeat(depth) + "}\n"; }
    else if (trimmed.endsWith("{")) { formatted += indentStr.repeat(depth) + trimmed + "\n"; depth++; }
    else { formatted += indentStr.repeat(depth) + trimmed + "\n"; }
  }
  return formatted.trim();
}
export default { formatCss };
