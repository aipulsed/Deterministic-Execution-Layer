/**
 * @file recordPayment.ts
 * @description Billing pipeline step: recordPayment
 */

import { v4 as uuidv4 } from "uuid";
import { logger } from "../../services/logger/logger";
export interface Payment { paymentId: string; invoiceId: string; amount: number; currency: string; method: string; paidAt: Date; reference?: string; }
const payments: Payment[] = [];
export async function recordPayment(invoiceId: string, amount: number, method: string, reference?: string): Promise<Payment> {
  const payment: Payment = { paymentId: uuidv4(), invoiceId, amount, currency: "USD", method, paidAt: new Date(), reference };
  payments.push(payment);
  logger.info("Payment recorded", undefined, { paymentId: payment.paymentId, invoiceId, amount });
  return payment;
}
export function getPaymentsForInvoice(invoiceId: string): Payment[] { return payments.filter((p) => p.invoiceId === invoiceId); }
export default { recordPayment, getPaymentsForInvoice };
