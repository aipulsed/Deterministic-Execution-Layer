/**
 * @file coding.test.ts
 * @description Unit tests for the coding pipeline steps.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { createProject } from '../../pipelines/coding/createProject';

describe('Coding Pipeline', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'del-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('createProject', () => {
    it('creates a node-ts project with required files', async () => {
      const result = await createProject({ name: 'test-project', outputDir: tmpDir, template: 'node-ts' });
      expect(result.success).toBe(true);
      expect(result.filesCreated).toContain('package.json');
      expect(result.filesCreated).toContain('tsconfig.json');
      expect(fs.existsSync(path.join(result.projectPath, 'package.json'))).toBe(true);
    });

    it('throws if project directory already exists', async () => {
      await createProject({ name: 'existing', outputDir: tmpDir, template: 'node-js' });
      await expect(createProject({ name: 'existing', outputDir: tmpDir })).rejects.toThrow();
    });

    it('creates a library template', async () => {
      const result = await createProject({ name: 'my-lib', outputDir: tmpDir, template: 'library' });
      expect(result.success).toBe(true);
      expect(result.filesCreated).toContain('src/index.ts');
    });
  });

  describe('compileCode', () => {
    it('returns unsupported language error gracefully', async () => {
      const { compileCode } = await import('../../pipelines/coding/compileCode');
      const result = await compileCode({ language: 'javascript', sourcePath: '/nonexistent.js' });
      expect(result.language).toBe('javascript');
    });
  });
});
