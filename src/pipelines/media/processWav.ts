/**
 * @file processWav.ts
 * @description Media pipeline step: processWav
 */

import { getAudioInfo } from "../../tools/media-handlers/mp3Processor";
import { logger } from "../../services/logger/logger";
export async function processWav(filePath: string) {
  const info = getAudioInfo(filePath);
  logger.info("WAV processed", undefined, { filePath });
  return { ...info, success: true, filePath };
}
export default { processWav };
