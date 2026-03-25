/**
 * @file createProject.ts
 * @description Pipeline step to scaffold a new code project with proper structure.
 */
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../../services/logger/logger';

export type ProjectTemplate = 'node-ts' | 'node-js' | 'react' | 'library';

export interface CreateProjectOptions {
  name: string;
  outputDir: string;
  template?: ProjectTemplate;
  description?: string;
  author?: string;
}

export interface CreateProjectResult {
  success: boolean;
  projectPath: string;
  filesCreated: string[];
}

const TEMPLATES: Record<ProjectTemplate, () => Record<string, string>> = {
  'node-ts': () => ({
    'package.json': JSON.stringify({ name: 'my-project', version: '1.0.0', scripts: { build: 'tsc', start: 'node dist/index.js' }, devDependencies: { typescript: '^5.0.0' } }, null, 2),
    'tsconfig.json': JSON.stringify({ compilerOptions: { target: 'ES2022', module: 'CommonJS', outDir: 'dist', strict: true } }, null, 2),
    'src/index.ts': `console.log('Hello, World!');`,
  }),
  'node-js': () => ({
    'package.json': JSON.stringify({ name: 'my-project', version: '1.0.0', scripts: { start: 'node index.js' } }, null, 2),
    'index.js': `console.log('Hello, World!');`,
  }),
  'react': () => ({
    'package.json': JSON.stringify({ name: 'my-app', version: '1.0.0', dependencies: { react: '^18.0.0', 'react-dom': '^18.0.0' } }, null, 2),
    'src/App.tsx': `export default function App() { return <h1>Hello World</h1>; }`,
    'src/index.tsx': `import React from 'react'; import ReactDOM from 'react-dom/client'; import App from './App';`,
  }),
  'library': () => ({
    'package.json': JSON.stringify({ name: 'my-lib', version: '1.0.0', main: 'dist/index.js', types: 'dist/index.d.ts' }, null, 2),
    'tsconfig.json': JSON.stringify({ compilerOptions: { target: 'ES2022', module: 'CommonJS', declaration: true, outDir: 'dist' } }, null, 2),
    'src/index.ts': `export const version = '1.0.0';`,
  }),
};

/**
 * Creates a new project scaffold from a template.
 * @param options - Project creation options
 * @returns Result with created files list
 */
export async function createProject(options: CreateProjectOptions): Promise<CreateProjectResult> {
  const template = options.template ?? 'node-ts';
  const projectPath = path.join(options.outputDir, options.name);
  const filesCreated: string[] = [];

  try {
    if (fs.existsSync(projectPath)) {
      throw new Error(`Project directory already exists: ${projectPath}`);
    }

    const files = TEMPLATES[template]();
    for (const [relPath, content] of Object.entries(files)) {
      const fullPath = path.join(projectPath, relPath);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, content, 'utf-8');
      filesCreated.push(relPath);
    }

    // Create .gitignore
    fs.writeFileSync(path.join(projectPath, '.gitignore'), 'node_modules/\ndist/\n.env\n');
    filesCreated.push('.gitignore');

    logger.info(`Project created: ${options.name}`, undefined, { template, projectPath });
    return { success: true, projectPath, filesCreated };
  } catch (err) {
    logger.error('Failed to create project', err);
    throw err;
  }
}

export default { createProject };
