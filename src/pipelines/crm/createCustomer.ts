/**
 * @file createCustomer.ts
 * @description CRM pipeline step to create a new customer record.
 */
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../services/logger/logger';

export interface Customer {
  customerId: string;
  email: string;
  firstName: string;
  lastName: string;
  company?: string;
  phone?: string;
  address?: CustomerAddress;
  tags?: string[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerAddress {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  zip?: string;
}

export interface CreateCustomerOptions {
  email: string;
  firstName: string;
  lastName: string;
  company?: string;
  phone?: string;
  address?: CustomerAddress;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

const customerStore = new Map<string, Customer>();

/**
 * Creates a new customer record.
 * @param options - Customer creation options
 * @returns Created customer
 */
export async function createCustomer(options: CreateCustomerOptions): Promise<Customer> {
  const existing = Array.from(customerStore.values()).find((c) => c.email === options.email);
  if (existing) throw new Error(`Customer with email ${options.email} already exists`);

  const customer: Customer = {
    customerId: uuidv4(),
    ...options,
    tags: options.tags ?? [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  customerStore.set(customer.customerId, customer);
  logger.info('Customer created', undefined, { customerId: customer.customerId, email: customer.email });
  return customer;
}

export function getCustomer(customerId: string): Customer | undefined {
  return customerStore.get(customerId);
}

export default { createCustomer, getCustomer };
