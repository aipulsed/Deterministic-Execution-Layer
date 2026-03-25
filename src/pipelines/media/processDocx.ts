/**
 * @file processDocx.ts
 * @description Media pipeline step: processDocx
 */

import { parseDocx } from "../../tools/media-handlers/docxParser";
import { logger } from "../../services/logger/logger";
export async function processDocx(filePath: string) {
  const result = await parseDocx(filePath);
  logger.info("DOCX processed", undefined, { filePath });
  return { ...result, success: true };
}
export default { processDocx };
