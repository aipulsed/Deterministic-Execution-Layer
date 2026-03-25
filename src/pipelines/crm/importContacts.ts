/**
 * @file importContacts.ts
 * @description CRM pipeline step: importContacts
 */

import { csvToJson } from "../../tools/converters/csvToJson";
import { createCustomer } from "./createCustomer";
import { logger } from "../../services/logger/logger";
export async function importContacts(csvContent: string): Promise<{ imported: number; failed: number; errors: string[] }> {
  const rows = csvToJson(csvContent);
  let imported = 0;
  let failed = 0;
  const errors: string[] = [];
  for (const row of rows) {
    try {
      await createCustomer({ email: row.email, firstName: row.firstName ?? row.first_name ?? "", lastName: row.lastName ?? row.last_name ?? "", company: row.company, phone: row.phone });
      imported++;
    } catch (err) {
      failed++;
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }
  logger.info("Contacts imported", undefined, { imported, failed });
  return { imported, failed, errors };
}
export default { importContacts };
