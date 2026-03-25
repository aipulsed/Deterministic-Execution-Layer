/**
 * @file billing.test.ts
 * @description Unit tests for the billing pipeline.
 */
import { describe, it, expect } from 'vitest';
import { generateInvoice } from '../../pipelines/billing/generateInvoice';
import { applyDiscount } from '../../pipelines/billing/applyDiscounts';
import { reconcileAccounts } from '../../pipelines/billing/reconcileAccounts';

describe('Billing Pipeline', () => {
  describe('generateInvoice', () => {
    it('generates an invoice with correct totals', async () => {
      const invoice = await generateInvoice({
        customerId: 'cust-1',
        customerName: 'Acme Corp',
        customerEmail: 'billing@acme.com',
        lineItems: [{ description: 'Service A', quantity: 2, unitPrice: 50 }, { description: 'Service B', quantity: 1, unitPrice: 100 }],
        taxRate: 10,
      });
      expect(invoice.subtotal).toBe(200);
      expect(invoice.taxAmount).toBe(20);
      expect(invoice.total).toBe(220);
      expect(invoice.status).toBe('draft');
      expect(invoice.invoiceNumber).toMatch(/^INV-/);
    });

    it('applies line item discounts', async () => {
      const invoice = await generateInvoice({
        customerId: 'cust-2',
        customerName: 'Test Co',
        customerEmail: 'test@test.com',
        lineItems: [{ description: 'Item', quantity: 1, unitPrice: 100, discount: 10 }],
      });
      expect(invoice.subtotal).toBe(90);
    });
  });

  describe('applyDiscount', () => {
    it('applies percentage discount correctly', async () => {
      const invoice = await generateInvoice({ customerId: 'c1', customerName: 'X', customerEmail: 'x@x.com', lineItems: [{ description: 'A', quantity: 1, unitPrice: 100 }] });
      const discounted = applyDiscount(invoice, { type: 'percentage', value: 20 });
      expect(discounted.subtotal).toBe(80);
    });

    it('applies fixed discount correctly', async () => {
      const invoice = await generateInvoice({ customerId: 'c1', customerName: 'X', customerEmail: 'x@x.com', lineItems: [{ description: 'A', quantity: 1, unitPrice: 100 }] });
      const discounted = applyDiscount(invoice, { type: 'fixed', value: 25 });
      expect(discounted.subtotal).toBe(75);
    });
  });

  describe('reconcileAccounts', () => {
    it('calculates outstanding correctly', async () => {
      const invoices = [{ total: 100, status: 'paid' }, { total: 200, status: 'issued' }, { total: 150, status: 'paid' }];
      const result = await reconcileAccounts(invoices, '2024-Q1');
      expect(result.totalInvoiced).toBe(450);
      expect(result.totalPaid).toBe(250);
      expect(result.outstanding).toBe(200);
    });
  });
});
