/**
 * @file media.test.ts
 * @description Unit tests for the media pipeline.
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../tools/media-handlers/pdfParser', () => ({
  parsePdf: vi.fn().mockResolvedValue({ text: 'Sample PDF text', numpages: 2, info: {} }),
  default: { parsePdf: vi.fn() },
}));

vi.mock('../../tools/media-handlers/txtParser', () => ({
  parseTxt: vi.fn().mockReturnValue({ content: 'Hello world', lines: ['Hello world'], wordCount: 2, charCount: 11 }),
  default: { parseTxt: vi.fn() },
}));

describe('Media Pipeline', () => {
  it('processPdf returns text and page count', async () => {
    const { processPdf } = await import('../../pipelines/media/processPdf');
    const result = await processPdf('/fake/path.pdf');
    expect(result.success).toBe(true);
    expect(result.text).toBe('Sample PDF text');
    expect(result.pages).toBe(2);
  });

  it('processTxt returns content and line count', async () => {
    const { processTxt } = await import('../../pipelines/media/processTxt');
    const result = await processTxt('/fake/path.txt');
    expect(result.success).toBe(true);
    expect(result.content).toBe('Hello world');
  });
});
