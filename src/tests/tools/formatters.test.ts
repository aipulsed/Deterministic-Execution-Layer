/**
 * @file formatters.test.ts
 * @description Tests for formatter tools.
 */
import { describe, it, expect } from 'vitest';
import { formatJson } from '../../tools/formatters/jsonFormatter';
import { formatCss } from '../../tools/formatters/cssFormatter';
import { formatMarkdown } from '../../tools/formatters/markdownFormatter';

describe('Formatters', () => {
  it('formats JSON with indentation', () => { expect(formatJson({ a: 1 })).toContain('  "a"'); });
  it('formats JSON with sorted keys', () => { const r = formatJson({ z: 2, a: 1 }, { sortKeys: true }); expect(r.indexOf('"a"')).toBeLessThan(r.indexOf('"z"')); });
  it('formats CSS removing extra whitespace', () => { const r = formatCss('body{color:red;font-size:14px;}'); expect(r).toContain('color: red'); });
  it('normalizes markdown line endings', () => { expect(formatMarkdown('# Hello\n\n\n\nWorld')).not.toContain('\n\n\n'); });
});
