import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {registerAttachmentTools} from './attachment.tools';
import {registerBudgetTools} from './budget.tools';
import {registerCategoryTools} from './category.tools';
import {registerPaymentMethodTools} from './paymentMethod.tools';
import {registerRecurringPaymentTools} from './recurringPayment.tools';
import {registerTransactionTools} from './transaction.tools';

export function registerAllTools(server: McpServer, userId: string): void {
  registerCategoryTools(server, userId);
  registerPaymentMethodTools(server, userId);
  registerTransactionTools(server, userId);
  registerRecurringPaymentTools(server, userId);
  registerBudgetTools(server, userId);
  registerAttachmentTools(server, userId);
}
