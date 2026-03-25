/**
 * @file jsonToXml.ts
 * @description Converts JSON object to XML string.
 */
import { XMLBuilder } from 'fast-xml-parser';
export function jsonToXml(data: Record<string, unknown>, options: { rootElement?: string } = {}): string {
  const builder = new XMLBuilder({ ignoreAttributes: false, attributeNamePrefix: '@_', format: true });
  const root = options.rootElement ? { [options.rootElement]: data } : data;
  return builder.build(root) as string;
}
export default { jsonToXml };
