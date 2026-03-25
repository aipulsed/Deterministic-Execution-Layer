/**
 * @file xlsxToCsv.ts
 * @description Converts XLSX file to CSV format.
 */
import { execSync } from 'child_process';
export function xlsxToCsvFile(inputPath: string, outputPath: string): void {
  // Uses ssconvert (gnumeric) if available, otherwise python's openpyxl
  try {
    execSync(`ssconvert "${inputPath}" "${outputPath}"`, { stdio: 'ignore' });
  } catch {
    execSync(`python3 -c "import openpyxl,csv; wb=openpyxl.load_workbook('${inputPath}'); ws=wb.active; f=open('${outputPath}','w',newline=''); w=csv.writer(f); [w.writerow(r) for r in ws.values]; f.close()"`, { stdio: 'ignore' });
  }
}
export default { xlsxToCsvFile };
