/**
 * @file redactSensitiveData.ts
 * @description Documents pipeline step: redactSensitiveData
 */

export interface RedactionPattern { name: string; pattern: RegExp; replacement: string; }
const DEFAULT_PATTERNS: RedactionPattern[] = [
  { name: "email", pattern: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, replacement: "[EMAIL_REDACTED]" },
  { name: "phone", pattern: /\+?[\d\s\-().]{10,}/g, replacement: "[PHONE_REDACTED]" },
  { name: "ssn", pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: "[SSN_REDACTED]" },
  { name: "creditcard", pattern: /\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b/g, replacement: "[CC_REDACTED]" },
];
export function redactSensitiveData(text: string, patterns: RedactionPattern[] = DEFAULT_PATTERNS): string {
  let result = text;
  for (const p of patterns) result = result.replace(p.pattern, p.replacement);
  return result;
}
export default { redactSensitiveData };
