/**
 * @file optimizeImages.ts
 * @description Media pipeline step: optimizeImages
 */

import { optimizeImage } from "../../tools/media-handlers/imageOptimizer";
import { logger } from "../../services/logger/logger";
export async function optimizeImages(files: Array<{ input: string; output: string }>, options: { quality?: number; maxWidth?: number } = {}) {
  const results = [];
  for (const f of files) {
    try {
      await optimizeImage(f.input, f.output, { quality: options.quality, width: options.maxWidth });
      results.push({ ...f, success: true });
    } catch (err) { results.push({ ...f, success: false, error: String(err) }); }
  }
  logger.info("Images optimized", undefined, { count: results.length });
  return results;
}
export default { optimizeImages };
