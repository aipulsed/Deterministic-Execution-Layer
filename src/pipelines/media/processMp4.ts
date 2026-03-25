/**
 * @file processMp4.ts
 * @description Media pipeline step: processMp4
 */

import { getVideoInfo } from "../../tools/media-handlers/mp4Processor";
import { logger } from "../../services/logger/logger";
export async function processMp4(filePath: string) {
  const info = getVideoInfo(filePath);
  logger.info("MP4 processed", undefined, { filePath, duration: info.duration });
  return { ...info, success: true, filePath };
}
export default { processMp4 };
