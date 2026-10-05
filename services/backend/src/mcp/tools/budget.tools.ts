import {Budget, CreateOrUpdateBudgetPayload} from '@budgetbuddyde/api/schemas';
import * as responses from '@budgetbuddyde/api/schemas';
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {z} from 'zod';
import {callTool} from './helpers';
import * as domain from '../../domain/budget';

export function registerBudgetTools(server: McpServer, userId: string): void {
  server.registerTool(
    'list_budgets',
    {
      description: 'List all budgets for the authenticated user',
      inputSchema: {
        from: z.number().optional().describe('Offset for pagination'),
        to: z.number().optional().describe('Limit for pagination'),
      },
    },
    async (params, _extra) => {
      return callTool(() => domain.list(userId, params), responses.GetAllBudgetsResponse);
    },
  );

  server.registerTool(
    'get_budget',
    {
      description: 'Get a single budget by ID',
      inputSchema: {
        id: Budget.shape.id.describe('Budget UUID'),
      },
    },
    async ({id}, _extra) => {
      return callTool(() => domain.get(userId, id), responses.GetBudgetResponse);
    },
  );

  server.registerTool(
    'create_budget',
    {
      description: 'Create a new budget',
      inputSchema: CreateOrUpdateBudgetPayload,
    },
    async (payload, _extra) => {
      return callTool(() => domain.create(userId, payload), responses.CreateBudgetResponse);
    },
  );

  server.registerTool(
    'update_budget',
    {
      description: 'Update an existing budget',
      inputSchema: CreateOrUpdateBudgetPayload.partial().extend({
        id: Budget.shape.id.describe('Budget UUID'),
      }),
    },
    async ({id, ...payload}, _extra) => {
      return callTool(() => domain.update(userId, id, payload), responses.UpdateBudgetResponse);
    },
  );

  server.registerTool(
    'delete_budget',
    {
      description: 'Delete a budget by ID',
      inputSchema: {
        id: Budget.shape.id.describe('Budget UUID'),
      },
    },
    async ({id}, _extra) => {
      return callTool(() => domain.remove(userId, id), responses.DeleteBudgetResponse);
    },
  );
}
