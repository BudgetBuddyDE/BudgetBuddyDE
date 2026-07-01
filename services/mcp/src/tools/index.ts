import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {registerAttachmentTools} from './attachment.tools';
import {registerBudgetTools} from './budget.tools';
import {registerCategoryTools} from './category.tools';
import {registerPaymentMethodTools} from './paymentMethod.tools';
import {registerRecurringPaymentTools} from './recurringPayment.tools';
import {registerTransactionTools} from './transaction.tools';

export function registerAllTools(server: McpServer): void {
  registerCategoryTools(server);
  registerPaymentMethodTools(server);
  registerTransactionTools(server);
  registerRecurringPaymentTools(server);
  registerBudgetTools(server);
  registerAttachmentTools(server);
}

export {ok, err} from './helpers';
