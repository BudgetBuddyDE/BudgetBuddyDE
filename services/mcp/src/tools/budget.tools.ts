import {Budget, CreateOrUpdateBudgetPayload} from '@budgetbuddyde/api/schemas';
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {z} from 'zod';
import {err, ok} from './helpers';
import {api, getApiRequestConfig} from '../lib/api';

export function registerBudgetTools(server: McpServer): void {
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
      const [result, error] = await api.backend.budget.getAll(params, getApiRequestConfig());
      if (error) return err(error);
      return ok(result);
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
      const [result, error] = await api.backend.budget.getById(id, getApiRequestConfig());
      if (error) return err(error);
      return ok(result);
    },
  );

  server.registerTool(
    'create_budget',
    {
      description: 'Create a new budget',
      inputSchema: CreateOrUpdateBudgetPayload,
    },
    async (payload, _extra) => {
      const [result, error] = await api.backend.budget.create(payload, getApiRequestConfig());
      if (error) return err(error);
      return ok(result);
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
      const [result, error] = await api.backend.budget.updateById(id, payload, getApiRequestConfig());
      if (error) return err(error);
      return ok(result);
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
      const [result, error] = await api.backend.budget.deleteById(id, getApiRequestConfig());
      if (error) return err(error);
      return ok(result);
    },
  );
}
