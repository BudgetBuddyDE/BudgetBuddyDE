import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {TCreateOrUpdateBudgetPayload} from '@budgetbuddyde/api/types';
import {z} from 'zod';
import {api, getApiRequestConfig} from '../lib/api';
import {err, ok} from './helpers';

export function registerBudgetTools(server: McpServer): void {
  server.tool('list_budgets', 'List all budgets for the authenticated user', {
    from: z.number().optional().describe('Offset for pagination'),
    to: z.number().optional().describe('Limit for pagination'),
  }, async (params) => {
    const [result, error] = await api.backend.budget.getAll(params, getApiRequestConfig());
    if (error) return err(error);
    return ok(result);
  });

  server.tool('get_budget', 'Get a single budget by ID', {
    id: z.string().uuid().describe('Budget UUID'),
  }, async ({id}) => {
    const [result, error] = await api.backend.budget.getById(id, getApiRequestConfig());
    if (error) return err(error);
    return ok(result);
  });

  server.tool(
    'create_budget',
    'Create a new budget',
    {
      type: z.enum(['i', 'e']).describe('Budget type: "i" = income, "e" = expense'),
      name: z.string().min(1).max(40).describe('Budget name'),
      budget: z.number().min(0).describe('Budget limit amount in EUR'),
      categories: z.array(z.string().uuid()).describe('Category UUIDs assigned to this budget'),
      description: z.string().max(200).optional().describe('Optional description'),
    },
    async (payload) => {
      const [result, error] = await api.backend.budget.create(
        payload as unknown as TCreateOrUpdateBudgetPayload,
        getApiRequestConfig(),
      );
      if (error) return err(error);
      return ok(result);
    },
  );

  server.tool(
    'update_budget',
    'Update an existing budget',
    {
      id: z.string().uuid().describe('Budget UUID'),
      type: z.enum(['i', 'e']).optional(),
      name: z.string().min(1).max(40).optional(),
      budget: z.number().min(0).optional(),
      categories: z.array(z.string().uuid()).optional(),
      description: z.string().max(200).optional(),
    },
    async ({id, ...payload}) => {
      const [result, error] = await api.backend.budget.updateById(
        id,
        payload as unknown as Partial<TCreateOrUpdateBudgetPayload>,
        getApiRequestConfig(),
      );
      if (error) return err(error);
      return ok(result);
    },
  );

  server.tool('delete_budget', 'Delete a budget by ID', {
    id: z.string().uuid().describe('Budget UUID'),
  }, async ({id}) => {
    const [result, error] = await api.backend.budget.deleteById(id, getApiRequestConfig());
    if (error) return err(error);
    return ok(result);
  });
}
