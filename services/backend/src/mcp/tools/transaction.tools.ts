import {Transaction, CreateOrUpdateTransactionPayload} from '@budgetbuddyde/api/schemas';
import * as responses from '@budgetbuddyde/api/schemas';
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {z} from 'zod';
import {callTool} from './helpers';
import * as domain from '../../domain/transaction';

// MCP input schemas must be representable as JSON Schema; Date instances are not.
const McpTransactionPayload = CreateOrUpdateTransactionPayload.omit({processedAt: true}).extend({
  processedAt: z.iso.datetime().describe('Transaction date as an ISO 8601 string'),
});

export function registerTransactionTools(server: McpServer, userId: string): void {
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

      return callTool(() => domain.listTransactions(userId, query), responses.GetAllTransactionsResponse);
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
      return callTool(() => domain.getTransaction(userId, id), responses.GetTransactionResponse);
    },
  );

  server.registerTool(
    'create_transaction',
    {
      description: 'Create a new transaction',
      inputSchema: McpTransactionPayload,
    },
    async (payload, _extra) => {
      return callTool(() => domain.createTransaction(userId, payload), responses.CreateTransactionResponse);
    },
  );

  server.registerTool(
    'update_transaction',
    {
      description: 'Update an existing transaction',
      inputSchema: McpTransactionPayload.partial().extend({
        id: Transaction.shape.id.describe('Transaction UUID'),
      }),
    },
    async ({id, ...payload}, _extra) => {
      return callTool(() => domain.updateTransaction(userId, id, payload), responses.UpdateTransactionResponse);
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
      return callTool(() => domain.removeTransaction(userId, id), responses.DeleteTransactionResponse);
    },
  );
}
