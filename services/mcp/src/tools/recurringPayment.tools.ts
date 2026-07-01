import type {TCreateOrUpdateRecurringPaymentPayload} from '@budgetbuddyde/api/types';
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {z} from 'zod';
import {err, ok} from './helpers';
import {api, getApiRequestConfig} from '../lib/api';

export function registerRecurringPaymentTools(server: McpServer): void {
  server.registerTool(
    'list_recurring_payments',
    {
      description: 'List recurring payments for the authenticated user',
      inputSchema: {
        from: z.number().optional().describe('Offset for pagination'),
        to: z.number().optional().describe('Limit for pagination'),
        search: z.string().optional().describe('Search term'),
      },
    },
    async (params, _extra) => {
      const [result, error] = await api.backend.recurringPayment.getAll(params, getApiRequestConfig());
      if (error) return err(error);
      return ok(result);
    },
  );

  server.registerTool(
    'get_recurring_payment',
    {
      description: 'Get a single recurring payment by ID',
      inputSchema: {
        id: z.string().uuid().describe('Recurring payment UUID'),
      },
    },
    async ({id}, _extra) => {
      const [result, error] = await api.backend.recurringPayment.getById(id, getApiRequestConfig());
      if (error) return err(error);
      return ok(result);
    },
  );

  server.registerTool(
    'create_recurring_payment',
    {
      description: 'Create a new recurring payment',
      inputSchema: {
        categoryId: z.string().uuid().describe('Category UUID'),
        paymentMethodId: z.string().uuid().describe('Payment method UUID'),
        executeAt: z.number().min(1).max(31).describe('Day of the month to execute (1–31)'),
        receiver: z.string().describe('Receiver / merchant name'),
        transferAmount: z.number().describe('Amount in EUR (negative = expense, positive = income)'),
        paused: z.boolean().optional().default(false).describe('Whether the payment is paused'),
        information: z.string().optional().describe('Optional note'),
      },
    },
    async (payload, _extra) => {
      const [result, error] = await api.backend.recurringPayment.create(
        payload as unknown as TCreateOrUpdateRecurringPaymentPayload,
        getApiRequestConfig(),
      );
      if (error) return err(error);
      return ok(result);
    },
  );

  server.registerTool(
    'update_recurring_payment',
    {
      description: 'Update an existing recurring payment',
      inputSchema: {
        id: z.string().uuid().describe('Recurring payment UUID'),
        categoryId: z.string().uuid().optional(),
        paymentMethodId: z.string().uuid().optional(),
        executeAt: z.number().min(1).max(31).optional(),
        receiver: z.string().optional(),
        transferAmount: z.number().optional(),
        paused: z.boolean().optional(),
        information: z.string().optional(),
      },
    },
    async ({id, ...payload}, _extra) => {
      const [result, error] = await api.backend.recurringPayment.updateById(
        id,
        payload as unknown as Partial<TCreateOrUpdateRecurringPaymentPayload>,
        getApiRequestConfig(),
      );
      if (error) return err(error);
      return ok(result);
    },
  );

  server.registerTool(
    'delete_recurring_payment',
    {
      description: 'Delete a recurring payment by ID',
      inputSchema: {
        id: z.string().uuid().describe('Recurring payment UUID'),
      },
    },
    async ({id}, _extra) => {
      const [result, error] = await api.backend.recurringPayment.deleteById(id, getApiRequestConfig());
      if (error) return err(error);
      return ok(result);
    },
  );
}
