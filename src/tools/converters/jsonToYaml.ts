/**
 * @file jsonToYaml.ts
 * @description Converts JSON object to YAML string.
 */
import yaml from 'js-yaml';
export function jsonToYaml(data: unknown, indent = 2): string {
  return yaml.dump(data, { indent, lineWidth: 120 });
}
export default { jsonToYaml };
