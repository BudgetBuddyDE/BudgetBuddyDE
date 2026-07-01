import type {TCreateOrUpdateBudgetPayload} from '@budgetbuddyde/api/types';
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
        id: z.string().uuid().describe('Budget UUID'),
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
      inputSchema: {
        type: z.enum(['i', 'e']).describe('Budget type: "i" = income, "e" = expense'),
        name: z.string().min(1).max(40).describe('Budget name'),
        budget: z.number().min(0).describe('Budget limit amount in EUR'),
        categories: z.array(z.string().uuid()).describe('Category UUIDs assigned to this budget'),
        description: z.string().max(200).optional().describe('Optional description'),
      },
    },
    async (payload, _extra) => {
      const [result, error] = await api.backend.budget.create(
        payload as unknown as TCreateOrUpdateBudgetPayload,
        getApiRequestConfig(),
      );
      if (error) return err(error);
      return ok(result);
    },
  );

  server.registerTool(
    'update_budget',
    {
      description: 'Update an existing budget',
      inputSchema: {
        id: z.string().uuid().describe('Budget UUID'),
        type: z.enum(['i', 'e']).optional(),
        name: z.string().min(1).max(40).optional(),
        budget: z.number().min(0).optional(),
        categories: z.array(z.string().uuid()).optional(),
        description: z.string().max(200).optional(),
      },
    },
    async ({id, ...payload}, _extra) => {
      const [result, error] = await api.backend.budget.updateById(
        id,
        payload as unknown as Partial<TCreateOrUpdateBudgetPayload>,
        getApiRequestConfig(),
      );
      if (error) return err(error);
      return ok(result);
    },
  );

  server.registerTool(
    'delete_budget',
    {
      description: 'Delete a budget by ID',
      inputSchema: {
        id: z.string().uuid().describe('Budget UUID'),
      },
    },
    async ({id}, _extra) => {
      const [result, error] = await api.backend.budget.deleteById(id, getApiRequestConfig());
      if (error) return err(error);
      return ok(result);
    },
  );
}
