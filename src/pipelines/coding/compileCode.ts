/**
 * @file compileCode.ts
 * @description Pipeline step to compile source code based on detected language.
 */
import { compileTypeScript } from '../../tools/compilers/tsCompiler';
import { buildGo } from '../../tools/compilers/goCompiler';
import { compileRust } from '../../tools/compilers/rustCompiler';
import { logger } from '../../services/logger/logger';
import * as path from 'path';

export type CompileLanguage = 'typescript' | 'go' | 'rust' | 'javascript';

export interface CompileCodeOptions {
  language: CompileLanguage;
  sourcePath: string;
  outputPath?: string;
  release?: boolean;
}

export interface CompileCodeResult {
  success: boolean;
  language: CompileLanguage;
  outputPath?: string;
  errors?: string[];
  duration: number;
}

/**
 * Compiles code for the specified language.
 * @param options - Compile options
 * @returns Compile result
 */
export async function compileCode(options: CompileCodeOptions): Promise<CompileCodeResult> {
  const start = Date.now();
  logger.info(`Compiling ${options.language} code`, undefined, { source: options.sourcePath });

  try {
    let result: { success: boolean; errors?: string[] };
    const outputPath = options.outputPath ?? path.join(path.dirname(options.sourcePath), 'dist');

    switch (options.language) {
      case 'typescript':
        result = compileTypeScript(options.sourcePath);
        break;
      case 'go':
        result = buildGo(options.sourcePath, outputPath);
        break;
      case 'rust':
        result = compileRust(options.sourcePath, outputPath, options.release);
        break;
      case 'javascript':
        result = { success: true };
        break;
      default:
        result = { success: false, errors: [`Unsupported language: ${options.language}`] };
    }

    const duration = Date.now() - start;
    logger.info(`Compile ${result.success ? 'succeeded' : 'failed'}`, undefined, { language: options.language, duration });
    return { ...result, language: options.language, outputPath, duration };
  } catch (err) {
    const duration = Date.now() - start;
    logger.error('Compile step failed', err);
    return { success: false, language: options.language, errors: [err instanceof Error ? err.message : String(err)], duration };
  }
}

export default { compileCode };
