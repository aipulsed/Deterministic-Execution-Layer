/**
 * @file extractAudio.ts
 * @description Media pipeline step: extractAudio
 */

import { extractAudio } from "../../tools/media-handlers/audioExtractor";
import { logger } from "../../services/logger/logger";
export async function extractAudioFromVideo(videoPath: string, outputPath: string, options: { format?: string } = {}) {
  extractAudio(videoPath, outputPath, options);
  logger.info("Audio extracted", undefined, { videoPath, outputPath });
  return { success: true, outputPath };
}
export default { extractAudioFromVideo };
