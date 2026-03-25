/**
 * @file imageOptimizer.ts
 * @description Image optimization using Sharp for resizing, compression, and format conversion.
 */
import sharp from 'sharp';

export interface ImageOptimizeOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp' | 'avif';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

export interface ImageMetadata {
  width?: number;
  height?: number;
  format?: string;
  size?: number;
  channels?: number;
}

export async function optimizeImage(inputPath: string, outputPath: string, options: ImageOptimizeOptions = {}): Promise<void> {
  let img = sharp(inputPath);
  if (options.width || options.height) {
    img = img.resize(options.width, options.height, { fit: options.fit ?? 'cover' });
  }
  if (options.format) {
    img = img.toFormat(options.format, { quality: options.quality ?? 80 });
  }
  await img.toFile(outputPath);
}

export async function optimizeBuffer(buffer: Buffer, options: ImageOptimizeOptions = {}): Promise<Buffer> {
  let img = sharp(buffer);
  if (options.width || options.height) {
    img = img.resize(options.width, options.height, { fit: options.fit ?? 'cover' });
  }
  if (options.format) {
    img = img.toFormat(options.format, { quality: options.quality ?? 80 });
  }
  return img.toBuffer();
}

export async function getImageMetadata(inputPath: string): Promise<ImageMetadata> {
  const meta = await sharp(inputPath).metadata();
  return { width: meta.width, height: meta.height, format: meta.format, channels: meta.channels };
}

export async function generateThumbnail(inputPath: string, outputPath: string, size = 200): Promise<void> {
  await sharp(inputPath).resize(size, size, { fit: 'cover' }).toFile(outputPath);
}

export default { optimizeImage, optimizeBuffer, getImageMetadata, generateThumbnail };
