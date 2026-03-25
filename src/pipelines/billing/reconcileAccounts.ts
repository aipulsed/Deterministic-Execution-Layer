/**
 * @file reconcileAccounts.ts
 * @description Billing pipeline step: reconcileAccounts
 */

import { logger } from "../../services/logger/logger";
export interface ReconciliationResult { period: string; totalInvoiced: number; totalPaid: number; outstanding: number; currency: string; }
export async function reconcileAccounts(invoices: Array<{ total: number; status: string }>, period: string): Promise<ReconciliationResult> {
  const totalInvoiced = invoices.reduce((s, i) => s + i.total, 0);
  const totalPaid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.total, 0);
  const result: ReconciliationResult = { period, totalInvoiced: Math.round(totalInvoiced * 100) / 100, totalPaid: Math.round(totalPaid * 100) / 100, outstanding: Math.round((totalInvoiced - totalPaid) * 100) / 100, currency: "USD" };
  logger.info("Accounts reconciled", undefined, { period, outstanding: result.outstanding });
  return result;
}
export default { reconcileAccounts };
