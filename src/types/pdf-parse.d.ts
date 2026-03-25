declare module 'pdf-parse' {
  interface PDFInfo {
    PDFFormatVersion?: string;
    Title?: string;
    Author?: string;
  }
  interface PDFData {
    numpages: number;
    numrender: number;
    info: PDFInfo;
    metadata: unknown;
    text: string;
    version: string;
  }
  function pdfParse(dataBuffer: Buffer | Uint8Array, options?: Record<string, unknown>): Promise<PDFData>;
  export = pdfParse;
}
