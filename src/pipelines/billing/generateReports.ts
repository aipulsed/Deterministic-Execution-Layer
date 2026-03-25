/**
 * @file generateReports.ts
 * @description Billing pipeline step: generateReports
 */

import { logger } from "../../services/logger/logger";
export interface BillingReport { period: string; totalRevenue: number; invoiceCount: number; averageInvoice: number; topCustomers: Array<{ customerId: string; revenue: number }>; }
export async function generateBillingReport(invoices: Array<{ customerId: string; total: number; status: string }>, period: string): Promise<BillingReport> {
  const paid = invoices.filter((i) => i.status === "paid");
  const totalRevenue = paid.reduce((s, i) => s + i.total, 0);
  const byCustomer = paid.reduce((acc, i) => { acc[i.customerId] = (acc[i.customerId] ?? 0) + i.total; return acc; }, {} as Record<string, number>);
  const topCustomers = Object.entries(byCustomer).sort(([, a], [, b]) => b - a).slice(0, 5).map(([customerId, revenue]) => ({ customerId, revenue }));
  const report: BillingReport = { period, totalRevenue: Math.round(totalRevenue * 100) / 100, invoiceCount: paid.length, averageInvoice: paid.length ? Math.round((totalRevenue / paid.length) * 100) / 100 : 0, topCustomers };
  logger.info("Billing report generated", undefined, { period, totalRevenue });
  return report;
}
export default { generateBillingReport };
