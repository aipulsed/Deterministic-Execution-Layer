/**
 * @file xmlToJson.ts
 * @description Converts XML string to JSON object.
 */
import { XMLParser } from 'fast-xml-parser';
export function xmlToJson(xml: string): Record<string, unknown> {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', parseTagValue: true });
  return parser.parse(xml) as Record<string, unknown>;
}
export default { xmlToJson };
