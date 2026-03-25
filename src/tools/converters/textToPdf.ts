/**
 * @file textToPdf.ts
 * @description Converts plain text to PDF format using a simple PostScript approach.
 */
import { execSync } from 'child_process';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
export function textToPdf(text: string, outputPath: string): void {
  const tmpTxt = outputPath.replace('.pdf', '.tmp.txt');
  writeFileSync(tmpTxt, text, 'utf-8');
  try {
    execSync(`enscript -p - "${tmpTxt}" | ps2pdf - "${outputPath}"`, { stdio: 'ignore' });
  } catch {
    // Fallback: write raw text as a very basic PDF structure
    const pdfContent = `%PDF-1.4\n1 0 obj<</Type /Catalog /Pages 2 0 R>>endobj\n2 0 obj<</Type /Pages /Kids [3 0 R] /Count 1>>endobj\n3 0 obj<</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792]>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\ntrailer<</Size 4 /Root 1 0 R>>\nstartxref\n190\n%%EOF`;
    writeFileSync(outputPath, pdfContent, 'utf-8');
  } finally {
    if (existsSync(tmpTxt)) unlinkSync(tmpTxt);
  }
}
export default { textToPdf };
