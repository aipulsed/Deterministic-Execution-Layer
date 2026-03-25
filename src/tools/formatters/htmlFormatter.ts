/**
 * @file htmlFormatter.ts
 * @description HTML formatter with indentation
 */

export function formatHtml(html: string, indent = 2): string {
  const indentStr = " ".repeat(indent);
  const voidElements = new Set(["area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"]);
  let depth = 0;
  const result: string[] = [];
  const parts = html.match(/<[^>]+>|[^<]+/g) ?? [];
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const tagMatch = trimmed.match(/^<\/?(\w+)/);
    const tagName = tagMatch?.[1]?.toLowerCase() ?? "";
    if (trimmed.startsWith("</")) { depth = Math.max(0, depth - 1); result.push(indentStr.repeat(depth) + trimmed); }
    else if (trimmed.startsWith("<") && !trimmed.endsWith("/>") && tagName && !voidElements.has(tagName)) { result.push(indentStr.repeat(depth) + trimmed); depth++; }
    else { result.push(indentStr.repeat(depth) + trimmed); }
  }
  return result.join("\n");
}
export default { formatHtml };
