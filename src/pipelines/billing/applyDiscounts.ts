/**
 * @file applyDiscounts.ts
 * @description Billing pipeline step: applyDiscounts
 */

import type { Invoice, InvoiceLineItem } from "./generateInvoice";
export type DiscountType = "percentage" | "fixed";
export interface Discount { type: DiscountType; value: number; description?: string; }
export function applyDiscount(invoice: Invoice, discount: Discount): Invoice {
  const modified = { ...invoice };
  if (discount.type === "percentage") {
    modified.subtotal = Math.round(invoice.subtotal * (1 - discount.value / 100) * 100) / 100;
  } else {
    modified.subtotal = Math.max(0, Math.round((invoice.subtotal - discount.value) * 100) / 100);
  }
  modified.taxAmount = Math.round(modified.subtotal * (invoice.taxRate / 100) * 100) / 100;
  modified.total = Math.round((modified.subtotal + modified.taxAmount) * 100) / 100;
  return modified;
}
export default { applyDiscount };
