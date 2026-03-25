/**
 * @file yamlValidator.ts
 * @description YAML format validation and parsing for the DEL.
 */

import yaml from 'js-yaml';

export interface YamlValidationResult {
  valid: boolean;
  errors: string[];
  parsed?: unknown;
}

/**
 * Validates and parses a YAML string.
 * @param yamlString - YAML content to validate
 * @returns Validation result with parsed data
 */
export function validateYaml(yamlString: string): YamlValidationResult {
  if (!yamlString.trim()) {
    return { valid: false, errors: ['YAML content is empty'] };
  }

  try {
    const parsed = yaml.load(yamlString);
    return { valid: true, errors: [], parsed };
  } catch (err) {
    const msg = err instanceof yaml.YAMLException ? err.message : String(err);
    return { valid: false, errors: [msg] };
  }
}

/**
 * Validates YAML and checks required top-level keys.
 * @param yamlString - YAML content
 * @param requiredKeys - Required top-level keys
 */
export function validateYamlStructure(yamlString: string, requiredKeys: string[]): YamlValidationResult {
  const result = validateYaml(yamlString);
  if (!result.valid) return result;

  const errors: string[] = [];
  const obj = result.parsed as Record<string, unknown>;

  if (typeof obj !== 'object' || obj === null) {
    return { valid: false, errors: ['YAML must parse to an object'] };
  }

  for (const key of requiredKeys) {
    if (!(key in obj)) errors.push(`Missing required key: '${key}'`);
  }

  return { valid: errors.length === 0, errors, parsed: result.parsed };
}

export default { validateYaml, validateYamlStructure };
