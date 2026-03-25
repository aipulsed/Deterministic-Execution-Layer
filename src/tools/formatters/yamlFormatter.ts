/**
 * @file yamlFormatter.ts
 * @description YAML formatter using js-yaml
 */

import yaml from "js-yaml";
export function formatYaml(input: unknown, indent = 2): string {
  return yaml.dump(input, { indent, lineWidth: 120, noRefs: true });
}
export function parseAndFormatYaml(yamlString: string, indent = 2): string {
  const parsed = yaml.load(yamlString);
  return formatYaml(parsed, indent);
}
export default { formatYaml, parseAndFormatYaml };
