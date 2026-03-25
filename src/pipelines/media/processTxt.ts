/**
 * @file processTxt.ts
 * @description Media pipeline step: processTxt
 */

import { parseTxt } from "../../tools/media-handlers/txtParser";
import { logger } from "../../services/logger/logger";
export async function processTxt(filePath: string) {
  const result = parseTxt(filePath);
  logger.info("TXT processed", undefined, { filePath, lines: result.lines.length });
  return { ...result, success: true };
}
export default { processTxt };
