/**
 * @file sendInvoiceEmail.ts
 * @description Billing pipeline step: sendInvoiceEmail
 */

import { sendEmail } from "../../services/email/sendEmail";
import type { Invoice } from "./generateInvoice";
export async function sendInvoiceEmail(invoice: Invoice): Promise<void> {
  await sendEmail({ to: invoice.customerEmail, subject: `Invoice ${invoice.invoiceNumber} - $${invoice.total} ${invoice.currency}`, html: `<h1>Invoice ${invoice.invoiceNumber}</h1><p>Total due: ${invoice.currency} ${invoice.total}</p><p>Due date: ${invoice.dueAt.toDateString()}</p>`, text: `Invoice ${invoice.invoiceNumber} - Total: ${invoice.currency} ${invoice.total} due by ${invoice.dueAt.toDateString()}` });
}
export default { sendInvoiceEmail };
