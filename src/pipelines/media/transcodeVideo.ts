/**
 * @file transcodeVideo.ts
 * @description Media pipeline step: transcodeVideo
 */

import { transcodeVideo } from "../../tools/media-handlers/videoTranscoder";
import { logger } from "../../services/logger/logger";
export async function transcodeVideoFile(inputPath: string, outputPath: string, options: { resolution?: string } = {}) {
  transcodeVideo(inputPath, outputPath, options);
  logger.info("Video transcoded", undefined, { inputPath, outputPath });
  return { success: true, outputPath };
}
export default { transcodeVideoFile };
