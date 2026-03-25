/**
 * @file yamlToJson.ts
 * @description Converts YAML string to JSON object.
 */
import yaml from 'js-yaml';
export function yamlToJson(yamlString: string): unknown {
  return yaml.load(yamlString);
}
export default { yamlToJson };
