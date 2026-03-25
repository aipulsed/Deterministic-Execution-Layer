/**
 * @file documents.test.ts
 * @description Unit tests for the documents pipeline.
 */
import { describe, it, expect } from 'vitest';
import { redactSensitiveData } from '../../pipelines/documents/redactSensitiveData';
import { summarizeDocument } from '../../pipelines/documents/summarizeDocument';

describe('Documents Pipeline', () => {
  describe('redactSensitiveData', () => {
    it('redacts email addresses', () => {
      const result = redactSensitiveData('Contact us at user@example.com for help.');
      expect(result).not.toContain('user@example.com');
      expect(result).toContain('[EMAIL_REDACTED]');
    });

    it('redacts credit card numbers', () => {
      const result = redactSensitiveData('Card: 4111 1111 1111 1111');
      expect(result).not.toContain('4111');
    });
  });

  describe('summarizeDocument', () => {
    it('returns key points and word count', async () => {
      const content = 'The first sentence is here. The second one follows. A third sentence concludes. Fourth point. Fifth!';
      const result = await summarizeDocument(content, 3);
      expect(result.keyPoints.length).toBeLessThanOrEqual(3);
      expect(result.wordCount).toBeGreaterThan(0);
      expect(result.estimatedReadTime).toBeGreaterThanOrEqual(1);
    });
  });
});
