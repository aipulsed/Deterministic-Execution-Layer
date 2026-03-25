/**
 * @file processPdf.ts
 * @description Media pipeline step: processPdf
 */

import { parsePdf } from "../../tools/media-handlers/pdfParser";
import { logger } from "../../services/logger/logger";
export async function processPdf(filePath: string): Promise<{ text: string; pages: number; success: boolean }> {
  try {
    const result = await parsePdf(filePath);
    logger.info("PDF processed", undefined, { filePath, pages: result.numpages });
    return { text: result.text, pages: result.numpages, success: true };
  } catch (err) { logger.error("PDF processing failed", err); return { text: "", pages: 0, success: false }; }
}
export default { processPdf };
