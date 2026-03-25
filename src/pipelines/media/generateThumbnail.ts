/**
 * @file generateThumbnail.ts
 * @description Media pipeline step: generateThumbnail
 */

import { generateThumbnail } from "../../tools/media-handlers/imageOptimizer";
import { logger } from "../../services/logger/logger";
export async function generateMediaThumbnail(inputPath: string, outputPath: string, size = 200) {
  await generateThumbnail(inputPath, outputPath, size);
  logger.info("Thumbnail generated", undefined, { inputPath, outputPath, size });
  return { success: true, outputPath };
}
export default { generateMediaThumbnail };
