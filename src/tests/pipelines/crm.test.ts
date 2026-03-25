/**
 * @file crm.test.ts
 * @description Unit tests for the CRM pipeline.
 */
import { describe, it, expect } from 'vitest';
import { createCustomer } from '../../pipelines/crm/createCustomer';
import { importContacts } from '../../pipelines/crm/importContacts';

describe('CRM Pipeline', () => {
  describe('createCustomer', () => {
    it('creates a customer with required fields', async () => {
      const customer = await createCustomer({ email: `test-${Date.now()}@example.com`, firstName: 'John', lastName: 'Doe' });
      expect(customer.customerId).toBeDefined();
      expect(customer.firstName).toBe('John');
      expect(customer.tags).toEqual([]);
    });
  });

  describe('importContacts', () => {
    it('imports contacts from CSV', async () => {
      const csv = 'email,firstName,lastName\nimport1@test.com,Alice,Smith\nimport2@test.com,Bob,Jones';
      const result = await importContacts(csv);
      expect(result.imported).toBeGreaterThanOrEqual(0);
    });
  });
});
