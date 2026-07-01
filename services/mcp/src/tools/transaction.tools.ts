import {Transaction, CreateOrUpdateTransactionPayload} from '@budgetbuddyde/api/schemas';
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {z} from 'zod';
import {err, ok} from './helpers';
import {api, getApiRequestConfig} from '../lib/api';

export function registerTransactionTools(server: McpServer): void {
  server.registerTool(
    'list_transactions',
    {
      description: 'List transactions for the authenticated user (paginated, filterable)',
      inputSchema: {
        from: z.number().optional().describe('Offset for pagination'),
        to: z.number().optional().describe('Limit for pagination'),
        search: z.string().optional().describe('Search term'),
        $dateFrom: z.string().optional().describe('ISO date string – filter transactions on or after this date'),
        $dateTo: z.string().optional().describe('ISO date string – filter transactions on or before this date'),
      },
    },
    async ({$dateFrom, $dateTo, ...rest}, _extra) => {
      const query = {
        ...rest,
        $dateFrom: $dateFrom ? new Date($dateFrom) : undefined,
        $dateTo: $dateTo ? new Date($dateTo) : undefined,
      };

      const [result, error] = await api.backend.transaction.getAll(query, getApiRequestConfig());
      if (error) return err(error);
      return ok(result);
    },
  );

  server.registerTool(
    'get_transaction',
    {
      description: 'Get a single transaction by ID',
      inputSchema: {
        id: Transaction.shape.id.describe('Transaction UUID'),
      },
    },
    async ({id}, _extra) => {
      const [result, error] = await api.backend.transaction.getById(id, getApiRequestConfig());
      if (error) return err(error);
      return ok(result);
    },
  );

  server.registerTool(
    'create_transaction',
    {
      description: 'Create a new transaction',
      inputSchema: CreateOrUpdateTransactionPayload,
    },
    async (payload, _extra) => {
      const [result, error] = await api.backend.transaction.create(payload, getApiRequestConfig());
      if (error) return err(error);
      return ok(result);
    },
  );

  server.registerTool(
    'update_transaction',
    {
      description: 'Update an existing transaction',
      inputSchema: CreateOrUpdateTransactionPayload.partial().extend({
        id: Transaction.shape.id.describe('Transaction UUID'),
      }),
    },
    async ({id, ...payload}, _extra) => {
      const [result, error] = await api.backend.transaction.updateById(id, payload, getApiRequestConfig());
      if (error) return err(error);
      return ok(result);
    },
  );

  server.registerTool(
    'delete_transaction',
    {
      description: 'Delete a transaction by ID',
      inputSchema: {
        id: Transaction.shape.id.describe('Transaction UUID'),
      },
    },
    async ({id}, _extra) => {
      const [result, error] = await api.backend.transaction.deleteById(id, getApiRequestConfig());
      if (error) return err(error);
      return ok(result);
    },
  );
}
