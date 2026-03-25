/**
 * @file logInteraction.ts
 * @description CRM pipeline step: logInteraction
 */

import { v4 as uuidv4 } from "uuid";
import { logger } from "../../services/logger/logger";
export type InteractionType = "call" | "email" | "meeting" | "note" | "support";
export interface CustomerInteraction { interactionId: string; customerId: string; type: InteractionType; notes: string; outcome?: string; agent?: string; occurredAt: Date; }
const interactions: CustomerInteraction[] = [];
export async function logInteraction(customerId: string, type: InteractionType, notes: string, options: { outcome?: string; agent?: string } = {}): Promise<CustomerInteraction> {
  const interaction: CustomerInteraction = { interactionId: uuidv4(), customerId, type, notes, outcome: options.outcome, agent: options.agent, occurredAt: new Date() };
  interactions.push(interaction);
  logger.info("Interaction logged", undefined, { customerId, type });
  return interaction;
}
export function getCustomerInteractions(customerId: string): CustomerInteraction[] { return interactions.filter((i) => i.customerId === customerId); }
export default { logInteraction, getCustomerInteractions };
