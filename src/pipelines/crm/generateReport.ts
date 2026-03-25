/**
 * @file generateReport.ts
 * @description CRM pipeline step: generateReport
 */

import { logger } from "../../services/logger/logger";
export interface CrmReport { period: string; newCustomers: number; activeCustomers: number; interactions: number; topInteractionTypes: Record<string, number>; }
export async function generateCrmReport(customers: Array<{ createdAt: Date }>, interactionLog: Array<{ type: string }>, period: string): Promise<CrmReport> {
  const newCutoff = new Date(Date.now() - 30 * 86400 * 1000);
  const newCustomers = customers.filter((c) => c.createdAt > newCutoff).length;
  const topInteractionTypes = interactionLog.reduce((acc, i) => { acc[i.type] = (acc[i.type] ?? 0) + 1; return acc; }, {} as Record<string, number>);
  const report: CrmReport = { period, newCustomers, activeCustomers: customers.length, interactions: interactionLog.length, topInteractionTypes };
  logger.info("CRM report generated", undefined, { period });
  return report;
}
export default { generateCrmReport };
