/**
 * @file converters.test.ts
 * @description Unit tests for converter tools.
 */
import { describe, it, expect } from 'vitest';
import { csvToJson } from '../../tools/converters/csvToJson';
import { jsonToCsv } from '../../tools/converters/jsonToCsv';
import { xmlToJson } from '../../tools/converters/xmlToJson';
import { jsonToXml } from '../../tools/converters/jsonToXml';
import { yamlToJson } from '../../tools/converters/yamlToJson';
import { jsonToYaml } from '../../tools/converters/jsonToYaml';
import { htmlToMarkdown } from '../../tools/converters/htmlToMarkdown';
import { markdownToHtml } from '../../tools/converters/markdownToHtml';

describe('Converters', () => {
  describe('csvToJson', () => {
    it('converts CSV with headers to JSON array', () => {
      const csv = 'name,age\nAlice,30\nBob,25';
      const result = csvToJson(csv);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Alice');
      expect(result[1].age).toBe('25');
    });
  });

  describe('jsonToCsv', () => {
    it('converts JSON array to CSV with headers', () => {
      const data = [{ name: 'Alice', age: 30 }, { name: 'Bob', age: 25 }];
      const csv = jsonToCsv(data as Record<string, unknown>[]);
      expect(csv).toContain('name');
      expect(csv).toContain('Alice');
    });
  });

  describe('xmlToJson', () => {
    it('parses XML to object', () => {
      const xml = '<root><name>Test</name><value>42</value></root>';
      const result = xmlToJson(xml);
      expect(result).toHaveProperty('root');
    });
  });

  describe('yamlToJson / jsonToYaml', () => {
    it('roundtrips YAML to JSON and back', () => {
      const yaml = 'name: test\nvalue: 42\n';
      const json = yamlToJson(yaml) as { name: string; value: number };
      expect(json.name).toBe('test');
      const backToYaml = jsonToYaml(json);
      expect(backToYaml).toContain('name: test');
    });
  });

  describe('htmlToMarkdown / markdownToHtml', () => {
    it('converts HTML to markdown', () => {
      const md = htmlToMarkdown('<h1>Hello</h1><p>World</p>');
      expect(md).toContain('Hello');
    });

    it('converts markdown to HTML', () => {
      const html = markdownToHtml('# Title\n\nSome text.');
      expect(html).toContain('<h1>');
      expect(html).toContain('Title');
    });
  });
});
