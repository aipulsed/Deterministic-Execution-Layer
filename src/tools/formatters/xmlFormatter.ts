/**
 * @file xmlFormatter.ts
 * @description XML formatter with indentation
 */

export function formatXml(xml: string, indent = 2): string {
  const indentStr = " ".repeat(indent);
  let formatted = "";
  let depth = 0;
  const parts = xml.match(/<[^>]+>|[^<]+/g) ?? [];
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("</")) { depth--; formatted += indentStr.repeat(depth) + trimmed + "\n"; }
    else if (trimmed.startsWith("<") && !trimmed.endsWith("/>") && !trimmed.includes("</")) { formatted += indentStr.repeat(depth) + trimmed + "\n"; depth++; }
    else { formatted += indentStr.repeat(depth) + trimmed + "\n"; }
  }
  return formatted.trim();
}
export default { formatXml };
