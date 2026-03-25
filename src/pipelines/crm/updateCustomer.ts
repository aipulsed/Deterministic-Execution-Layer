/**
 * @file updateCustomer.ts
 * @description CRM pipeline step: updateCustomer
 */

import { getCustomer, type Customer } from "./createCustomer";
import { logger } from "../../services/logger/logger";
export async function updateCustomer(customerId: string, updates: Partial<Omit<Customer, "customerId" | "createdAt">>): Promise<Customer> {
  const customer = getCustomer(customerId);
  if (!customer) throw new Error(`Customer ${customerId} not found`);
  Object.assign(customer, { ...updates, updatedAt: new Date() });
  logger.info("Customer updated", undefined, { customerId });
  return customer;
}
export default { updateCustomer };
