/**
 * @file xmlSchemaValidator.ts
 * @description XML schema validation using fast-xml-parser for the DEL.
 */

import { XMLParser, XMLValidator } from 'fast-xml-parser';

export interface XmlValidationResult {
  valid: boolean;
  errors: string[];
  parsed?: Record<string, unknown>;
}

/**
 * Validates that a string is well-formed XML.
 * @param xmlString - XML content to validate
 * @returns Validation result
 */
export function validateXml(xmlString: string): XmlValidationResult {
  const result = XMLValidator.validate(xmlString, { allowBooleanAttributes: true });

  if (result === true) {
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
    try {
      const parsed = parser.parse(xmlString) as Record<string, unknown>;
      return { valid: true, errors: [], parsed };
    } catch (err) {
      return { valid: false, errors: [err instanceof Error ? err.message : 'XML parse error'] };
    }
  }

  return { valid: false, errors: [result.err.msg] };
}

/**
 * Validates XML and checks that required root element and attributes exist.
 * @param xmlString - XML content
 * @param rootElement - Expected root element name
 * @param requiredAttributes - Required attributes on root
 */
export function validateXmlStructure(
  xmlString: string,
  rootElement: string,
  requiredAttributes: string[] = [],
): XmlValidationResult {
  const result = validateXml(xmlString);
  if (!result.valid) return result;

  const errors: string[] = [];
  const root = result.parsed?.[rootElement];

  if (!root) {
    errors.push(`Missing root element '${rootElement}'`);
  } else {
    for (const attr of requiredAttributes) {
      const attrKey = `@_${attr}`;
      if (typeof root === 'object' && !(attrKey in (root as object))) {
        errors.push(`Root element '${rootElement}' missing required attribute '${attr}'`);
      }
    }
  }

  return { valid: errors.length === 0, errors, parsed: result.parsed };
}

export default { validateXml, validateXmlStructure };
