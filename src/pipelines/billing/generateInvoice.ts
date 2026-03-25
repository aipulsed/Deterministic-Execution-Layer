/**
 * @file generateInvoice.ts
 * @description Pipeline step to generate customer invoices with line items.
 */
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../services/logger/logger';

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
}

export interface Invoice {
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  currency: string;
  issuedAt: Date;
  dueAt: Date;
  status: 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
}

export interface GenerateInvoiceOptions {
  customerId: string;
  customerName: string;
  customerEmail: string;
  lineItems: InvoiceLineItem[];
  taxRate?: number;
  currency?: string;
  dueDays?: number;
  notes?: string;
}

/**
 * Generates an invoice from customer and line item data.
 * @param options - Invoice generation options
 * @returns Generated invoice
 */
export async function generateInvoice(options: GenerateInvoiceOptions): Promise<Invoice> {
  const lineItems = options.lineItems.map((item) => {
    const discount = item.discount ?? 0;
    return { ...item, discount, unitPrice: item.unitPrice * (1 - discount / 100) };
  });

  const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const taxRate = options.taxRate ?? 0;
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const invoice: Invoice = {
    invoiceId: uuidv4(),
    invoiceNumber: `INV-${Date.now()}`,
    customerId: options.customerId,
    customerName: options.customerName,
    customerEmail: options.customerEmail,
    lineItems,
    subtotal: Math.round(subtotal * 100) / 100,
    taxRate,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
    currency: options.currency ?? 'USD',
    issuedAt: new Date(),
    dueAt: new Date(Date.now() + (options.dueDays ?? 30) * 86400 * 1000),
    status: 'draft',
    notes: options.notes,
  };

  logger.info('Invoice generated', undefined, { invoiceId: invoice.invoiceId, total: invoice.total });
  return invoice;
}

export default { generateInvoice };
