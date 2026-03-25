/**
 * @file processMp3.ts
 * @description Media pipeline step: processMp3
 */

import { getAudioInfo } from "../../tools/media-handlers/mp3Processor";
import { logger } from "../../services/logger/logger";
export async function processMp3(filePath: string) {
  const info = getAudioInfo(filePath);
  logger.info("MP3 processed", undefined, { filePath, duration: info.duration });
  return { ...info, success: true, filePath };
}
export default { processMp3 };
