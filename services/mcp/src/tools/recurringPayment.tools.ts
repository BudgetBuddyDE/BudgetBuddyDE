import {RecurringPayment, CreateOrUpdateRecurringPaymentPayload} from '@budgetbuddyde/api/schemas';
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
        id: RecurringPayment.shape.id.describe('Recurring payment UUID'),
      },
    },
    async ({id}, _extra) => {
      const [result, error] = await api.backend.recurringPayment.getById(id, getApiRequestConfig());
      if (error) return err(error);
      return ok(result);
    },
  );

  server.registerTool(
    'list_recurring_payment_occurrences',
    {
      description: 'Project recurring payment occurrence dates for the authenticated user',
      inputSchema: {
        dateFrom: z.iso.date().describe('First date to include (YYYY-MM-DD)'),
        dateTo: z.iso.date().describe('Last date to include (YYYY-MM-DD, at most 366 days from dateFrom)'),
        includePaused: z.boolean().optional().describe('Include paused recurring payments; defaults to false'),
        from: z.number().int().nonnegative().optional().describe('Offset for pagination'),
        to: z.number().int().nonnegative().optional().describe('Exclusive end offset for pagination (max. 100 rows)'),
      },
    },
    async ({dateFrom, dateTo, includePaused, from, to}, _extra) => {
      const [result, error] = await api.backend.recurringPayment.getOccurrences(
        {$dateFrom: dateFrom, $dateTo: dateTo, $includePaused: includePaused, from, to},
        getApiRequestConfig(),
      );
      if (error) return err(error);
      return ok(result);
    },
  );

  server.registerTool(
    'create_recurring_payment',
    {
      description: 'Create a recurring payment with an execution plan and first execution date',
      inputSchema: CreateOrUpdateRecurringPaymentPayload,
    },
    async (payload, _extra) => {
      const [result, error] = await api.backend.recurringPayment.create(payload, getApiRequestConfig());
      if (error) return err(error);
      return ok(result);
    },
  );

  server.registerTool(
    'update_recurring_payment',
    {
      description: 'Update a recurring payment, including its execution plan or first execution date',
      inputSchema: CreateOrUpdateRecurringPaymentPayload.partial().extend({
        id: RecurringPayment.shape.id.describe('Recurring payment UUID'),
      }),
    },
    async ({id, ...payload}, _extra) => {
      const [result, error] = await api.backend.recurringPayment.updateById(id, payload, getApiRequestConfig());
      if (error) return err(error);
      return ok(result);
    },
  );

  server.registerTool(
    'delete_recurring_payment',
    {
      description: 'Delete a recurring payment by ID',
      inputSchema: {
        id: RecurringPayment.shape.id.describe('Recurring payment UUID'),
      },
    },
    async ({id}, _extra) => {
      const [result, error] = await api.backend.recurringPayment.deleteById(id, getApiRequestConfig());
      if (error) return err(error);
      return ok(result);
    },
  );
}
