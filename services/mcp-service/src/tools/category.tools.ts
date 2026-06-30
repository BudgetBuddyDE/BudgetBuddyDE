import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {z} from 'zod';
import {api, getApiRequestConfig} from '../lib/api';
import {err, ok} from './helpers';

export function registerCategoryTools(server: McpServer): void {
  server.tool('list_categories', 'List all categories for the authenticated user', {
    from: z.number().optional().describe('Offset for pagination'),
    to: z.number().optional().describe('Limit for pagination'),
    search: z.string().optional().describe('Search term to filter categories by name or description'),
  }, async (params) => {
    const [result, error] = await api.backend.category.getAll(params, getApiRequestConfig());
    if (error) return err(error);
    return ok(result);
  });

  server.tool('get_category', 'Get a single category by ID', {
    id: z.string().uuid().describe('Category UUID'),
  }, async ({id}) => {
    const [result, error] = await api.backend.category.getById(id, getApiRequestConfig());
    if (error) return err(error);
    return ok(result);
  });

  server.tool(
    'create_category',
    'Create a new category',
    {
      name: z.string().describe('Category name'),
      description: z.string().optional().describe('Optional description'),
    },
    async (payload) => {
      const [result, error] = await api.backend.category.create(payload, getApiRequestConfig());
      if (error) return err(error);
      return ok(result);
    },
  );

  server.tool(
    'update_category',
    'Update an existing category',
    {
      id: z.string().uuid().describe('Category UUID'),
      name: z.string().optional().describe('New name'),
      description: z.string().optional().describe('New description'),
    },
    async ({id, ...payload}) => {
      const [result, error] = await api.backend.category.updateById(id, payload, getApiRequestConfig());
      if (error) return err(error);
      return ok(result);
    },
  );

  server.tool('delete_category', 'Delete a category by ID', {
    id: z.string().uuid().describe('Category UUID'),
  }, async ({id}) => {
    const [result, error] = await api.backend.category.deleteById(id, getApiRequestConfig());
    if (error) return err(error);
    return ok(result);
  });
}
