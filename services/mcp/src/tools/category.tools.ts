import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {z} from 'zod';
import {err, ok} from './helpers';
import {api, getApiRequestConfig} from '../lib/api';

export function registerCategoryTools(server: McpServer): void {
  server.registerTool(
    'list_categories',
    {
      description: 'List all categories for the authenticated user',
      inputSchema: {
        from: z.number().optional().describe('Offset for pagination'),
        to: z.number().optional().describe('Limit for pagination'),
        search: z.string().optional().describe('Search term to filter categories by name or description'),
      },
    },
    async (params, _extra) => {
      const [result, error] = await api.backend.category.getAll(params, getApiRequestConfig());
      if (error) return err(error);
      return ok(result);
    },
  );

  server.registerTool(
    'get_category',
    {
      description: 'Get a single category by ID',
      inputSchema: {
        id: z.string().uuid().describe('Category UUID'),
      },
    },
    async ({id}, _extra) => {
      const [result, error] = await api.backend.category.getById(id, getApiRequestConfig());
      if (error) return err(error);
      return ok(result);
    },
  );

  server.registerTool(
    'create_category',
    {
      description: 'Create a new category',
      inputSchema: {
        name: z.string().describe('Category name'),
        description: z.string().optional().describe('Optional description'),
      },
    },
    async (payload, _extra) => {
      const [result, error] = await api.backend.category.create(payload, getApiRequestConfig());
      if (error) return err(error);
      return ok(result);
    },
  );

  server.registerTool(
    'update_category',
    {
      description: 'Update an existing category',
      inputSchema: {
        id: z.string().uuid().describe('Category UUID'),
        name: z.string().optional().describe('New name'),
        description: z.string().optional().describe('New description'),
      },
    },
    async ({id, ...payload}, _extra) => {
      const [result, error] = await api.backend.category.updateById(id, payload, getApiRequestConfig());
      if (error) return err(error);
      return ok(result);
    },
  );

  server.registerTool(
    'delete_category',
    {
      description: 'Delete a category by ID',
      inputSchema: {
        id: z.string().uuid().describe('Category UUID'),
      },
    },
    async ({id}, _extra) => {
      const [result, error] = await api.backend.category.deleteById(id, getApiRequestConfig());
      if (error) return err(error);
      return ok(result);
    },
  );
}
