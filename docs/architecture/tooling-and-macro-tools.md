# Tooling and Macro Tools

The Deterministic Execution Layer (DEL) ships an extensive library of stateless tools under `src/tools/`. These tools perform discrete transformations — linting, formatting, minification, conversion, compilation, and bundling — across more than ten programming languages and data formats.

Tools are invoked by Steps within Pipelines. Because they are stateless and have no side effects beyond their return value, they are easy to test, compose, and substitute.

## Tool categories

### Linters (`src/tools/linters/`)

Linters analyze source code or data for style violations, potential errors, and anti-patterns without executing the code.

| File | Language / Format | Underlying tool |
|------|------------------|----------------|
| `eslint.ts` | JavaScript | ESLint |
| `tslint.ts` | TypeScript | TSLint / ESLint with TS rules |
| `pythonLint.ts` | Python | pylint / flake8 |
| `goLint.ts` | Go | golangci-lint |
| `rubyLint.ts` | Ruby | RuboCop |
| `cppLint.ts` | C++ | cpplint |
| `stylelint.ts` | CSS / SCSS / LESS | Stylelint |
| `htmlhint.ts` | HTML | HTMLHint |
| `markdownlint.ts` | Markdown | markdownlint |
| `jsonlint.ts` | JSON | jsonlint |

Linters return a structured result containing: a pass/fail status, an array of diagnostic messages, and (where supported) machine-readable rule IDs and positions.

### Formatters (`src/tools/formatters/`)

Formatters rewrite source code or data to conform to a consistent style. Unlike linters, formatters produce output — the reformatted content.

| File | Format |
|------|--------|
| `prettier.ts` | JavaScript, TypeScript, JSON, Markdown, CSS (via Prettier) |
| `codeFormatter.ts` | Generic code formatting wrapper |
| `htmlFormatter.ts` | HTML |
| `cssFormatter.ts` | CSS |
| `jsonFormatter.ts` | JSON (pretty-print with stable key ordering) |
| `xmlFormatter.ts` | XML |
| `yamlFormatter.ts` | YAML |
| `sqlFormatter.ts` | SQL |
| `markdownFormatter.ts` | Markdown |

Formatters are idempotent: formatting already-formatted content returns the same content unchanged.

### Minifiers (`src/tools/minifiers/`)

Minifiers reduce file size by removing whitespace, comments, and other non-semantic content. They are used in the coding pipeline's production build step.

| File | Format |
|------|--------|
| `jsMinifier.ts` | JavaScript |
| `tsMinifier.ts` | TypeScript (compiled output) |
| `cssMinifier.ts` | CSS |
| `htmlMinifier.ts` | HTML |
| `jsonMinifier.ts` | JSON |
| `xmlMinifier.ts` | XML |
| `svgMinifier.ts` | SVG |
| `wasmMinifier.ts` | WebAssembly (WASM) |

Minifiers are deterministic: the same input always produces the same minified output.

### Converters (`src/tools/converters/`)

Converters transform data from one format to another. All conversions are deterministic and lossless within the expressiveness of both formats.

| File | Conversion |
|------|-----------|
| `csvToJson.ts` | CSV → JSON |
| `jsonToCsv.ts` | JSON → CSV |
| `jsonToYaml.ts` | JSON → YAML |
| `yamlToJson.ts` | YAML → JSON |
| `jsonToXml.ts` | JSON → XML |
| `xmlToJson.ts` | XML → JSON |
| `jsonToTxt.ts` | JSON → plain text |
| `txtToJson.ts` | Plain text → JSON |
| `markdownToHtml.ts` | Markdown → HTML |
| `htmlToMarkdown.ts` | HTML → Markdown |
| `csvToXlsx.ts` | CSV → Excel (XLSX) |
| `xlsxToCsv.ts` | Excel (XLSX) → CSV |
| `pdfToText.ts` | PDF → plain text (via pdf-parse) |
| `textToPdf.ts` | Plain text → PDF |

### Compilers (`src/tools/compilers/`)

Compilers transform source code into an executable or deployable artifact.

| File | Language |
|------|---------|
| `tsCompiler.ts` | TypeScript → JavaScript (tsc) |
| `jsCompiler.ts` | JavaScript (transpile/transform via Babel/SWC) |
| `pythonCompiler.ts` | Python (syntax check + bytecode compilation) |
| `goCompiler.ts` | Go (go build) |
| `rustCompiler.ts` | Rust (cargo build) |
| `wasmCompiler.ts` | WebAssembly (emscripten / wasm-pack) |
| `lessCompiler.ts` | LESS → CSS |
| `sassCompiler.ts` | SASS/SCSS → CSS |

Compilers accept a source input and return the compiled artifact plus any diagnostics (errors, warnings).

### Bundlers (`src/tools/bundlers/`)

Bundlers combine multiple source files and their dependencies into a single output file suitable for deployment or distribution.

| File | Bundler |
|------|--------|
| `esbuildBundler.ts` | esbuild (fast, default for most DEL pipelines) |
| `rollupBundler.ts` | Rollup (library/ESM output) |
| `webpackBundler.ts` | Webpack (complex app bundling) |
| `parcelBundler.ts` | Parcel (zero-config bundling) |

Bundlers accept an entry point and configuration, returning the bundled content and a source map.

### Validators (`src/tools/validators/`)

Validators check that data conforms to a declared schema. They return a structured result with pass/fail status and a list of validation errors.

| File | Validation approach |
|------|-------------------|
| `schemaValidator.ts` | Zod schema validation (primary validator for DEL) |
| `jsonSchemaValidator.ts` | JSON Schema (draft-07) via Ajv |
| `xmlSchemaValidator.ts` | XML Schema (XSD) |
| `csvValidator.ts` | CSV structure and type validation |
| `yamlValidator.ts` | YAML syntax and schema validation |
| `fileValidator.ts` | File type, size, and MIME type validation |

See [Validation and Autofix](validation-and-autofix.md) for details on how validators integrate with the pipeline.

### Media handlers (`src/tools/media-handlers/`)

Media handlers process binary media files. They wrap external native libraries.

| Handler | Library | Formats |
|---------|---------|---------|
| Image processing | Sharp | JPEG, PNG, WebP, AVIF, TIFF, GIF |
| Audio/video processing | ffmpeg | MP3, WAV, MP4, WebM, and many more |
| PDF parsing | pdf-parse | PDF text and metadata extraction |

## Using tools in a Step

Tools are imported directly into Step files and called as pure functions:

```typescript
import { jsMinifier } from '../../tools/minifiers/jsMinifier';
import { schemaValidator } from '../../tools/validators/schemaValidator';

const validated = schemaValidator(inputSchema, rawInput);
const minified = jsMinifier(compiledJs);
```

Because tools have no dependencies on the Service layer, they can be unit-tested without any infrastructure setup.

## Adding a new tool

See the [Adding a Tool guide](../guides/adding-a-tool.md) for step-by-step instructions.
