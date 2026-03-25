# Domains

A **Domain** in the Deterministic Execution Layer (DEL) is a business-oriented grouping of related Pipelines. Domains provide a clean boundary between different areas of functionality and prevent cross-domain coupling.

All domain implementations live under `src/pipelines/<domain>/`. Each file in a domain directory implements one Pipeline or a set of related Steps.

## Built-in domains

DEL ships with five built-in domains.

### `coding`

The coding domain handles software development workflows: transforming, validating, and packaging source code.

**Pipeline files:**

| File | Purpose |
|------|---------|
| `createProject.ts` | Scaffold a new project structure |
| `compileCode.ts` | Compile source code (TypeScript, JavaScript, Python, Go, Rust) |
| `lintCode.ts` | Run language-appropriate linters on source files |
| `formatCode.ts` | Apply formatters (Prettier, language-specific formatters) |
| `runUnitTests.ts` | Execute a test suite and collect results |
| `testCode.ts` | Full test pipeline (lint → compile → test) |
| `bundleCode.ts` | Bundle source code using esbuild, Rollup, Webpack, or Parcel |
| `minifyCode.ts` | Minify compiled output |
| `convertCode.ts` | Transpile code between languages or module formats |
| `resolveImports.ts` | Analyze and resolve import graphs |
| `analyzeDependencies.ts` | Audit dependencies for vulnerabilities and outdated versions |
| `generateDocs.ts` | Generate documentation from source annotations |

**Key tools used:** compilers (`src/tools/compilers/`), linters (`src/tools/linters/`), formatters (`src/tools/formatters/`), bundlers (`src/tools/bundlers/`), minifiers (`src/tools/minifiers/`).

### `billing`

The billing domain handles payment and subscription workflows.

**Typical pipelines:**

- Process a payment transaction
- Generate and send an invoice
- Manage subscription lifecycle (create, update, cancel)
- Reconcile billing records

**Key services used:** `database`, `email`, `queue`, `crypto` (for payment data encryption).

### `crm`

The CRM (Customer Relationship Management) domain manages customer data and interaction workflows.

**Typical pipelines:**

- Create or update a customer record
- Manage contact lists
- Process inbound lead data
- Trigger CRM-driven email campaigns

**Key services used:** `database`, `email`, `queue`, `storage`.

### `media`

The media domain processes multimedia files: images, audio, video, PDFs, and DOCX files.

**Pipeline files:**

| File | Purpose |
|------|---------|
| `processPdf.ts` | Extract text, metadata, and pages from PDFs |
| `processDocx.ts` | Parse and transform DOCX documents |
| `processMp3.ts` | Process MP3 audio files (metadata, transcoding) |
| `processMp4.ts` | Process MP4 video files |
| `processWav.ts` | Process WAV audio files |
| `processTxt.ts` | Process plain text files |
| `optimizeImages.ts` | Resize, compress, and convert images (Sharp) |
| `generateThumbnail.ts` | Generate image thumbnails from documents or video frames |
| `extractAudio.ts` | Extract audio tracks from video files (ffmpeg) |
| `transcodeVideo.ts` | Transcode video to different formats or bitrates (ffmpeg) |

**Key tools used:** `src/tools/media-handlers/`, Sharp for images, ffmpeg for audio/video, pdf-parse for PDFs.

### `documents`

The documents domain handles document-level workflows: conversion, validation, and metadata extraction.

**Pipeline files:**

| File | Purpose |
|------|---------|
| `convertDocument.ts` | Convert documents between formats (PDF↔DOCX, Markdown→HTML, etc.) |
| `validateDocument.ts` | Validate document structure and content against a schema |
| `extractMetadata.ts` | Extract metadata (author, creation date, page count) from documents |

**Key tools used:** converters (`src/tools/converters/`), validators (`src/tools/validators/`).

## Domain structure conventions

Each domain follows these conventions:

```
src/pipelines/<domain>/
├── <pipelineA>.ts       # One pipeline or step per file
├── <pipelineB>.ts
└── index.ts             # (optional) re-exports all pipelines in the domain
```

Each pipeline file exports:

- A typed input schema (Zod)
- A typed output schema (Zod)
- The pipeline/step implementation function
- (optional) A DAG definition if the pipeline has multiple Steps

## Adding a new domain

See the [Adding a Domain guide](../guides/adding-a-domain.md) for step-by-step instructions on creating a new business domain.

## Cross-domain dependencies

Domains should not import from each other's pipeline files. If a Step is needed by multiple domains, extract it to `src/helpers/` or `src/tools/`. Cross-domain communication should happen through the Service layer (e.g., via the queue service) rather than direct function calls.
