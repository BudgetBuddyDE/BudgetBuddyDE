import {Category, CreateOrUpdateCategoryPayload} from '@budgetbuddyde/api/schemas';
import * as responses from '@budgetbuddyde/api/schemas';
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {z} from 'zod';
import {callTool} from './helpers';
import * as domain from '../../domain/category';

const legacyPayload = CreateOrUpdateCategoryPayload.omit({parentId: true});
const legacyCategory = Category.omit({parentId: true});

export function registerCategoryTools(server: McpServer, userId: string): void {
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
      return callTool(
        () => domain.list(userId, params),
        responses.GetAllCategoriesResponse.extend({data: z.array(legacyCategory).nullable()}),
      );
    },
  );

  server.registerTool(
    'get_category',
    {
      description: 'Get a single category by ID',
      inputSchema: {
        id: Category.shape.id.describe('Category UUID'),
      },
    },
    async ({id}, _extra) => {
      return callTool(
        () => domain.get(userId, id),
        responses.GetCategoryResponse.extend({data: legacyCategory.nullable()}),
      );
    },
  );

  server.registerTool(
    'create_category',
    {
      description: 'Create a new category',
      inputSchema: legacyPayload,
    },
    async (payload, _extra) => {
      return callTool(
        () => domain.create(userId, payload),
        responses.CreateCategoryResponse.extend({data: z.array(legacyCategory).nullable()}),
      );
    },
  );

  server.registerTool(
    'update_category',
    {
      description: 'Update an existing category',
      inputSchema: legacyPayload.partial().extend({
        id: Category.shape.id.describe('Category UUID'),
      }),
    },
    async ({id, ...payload}, _extra) => {
      return callTool(
        () => domain.update(userId, id, payload),
        responses.UpdateCategoryResponse.extend({data: z.array(legacyCategory).nullable()}),
      );
    },
  );

  server.registerTool(
    'delete_category',
    {
      description: 'Delete a category by ID',
      inputSchema: {
        id: Category.shape.id.describe('Category UUID'),
      },
    },
    async ({id}, _extra) => {
      return callTool(
        () => domain.remove(userId, id),
        responses.DeleteCategoryResponse.extend({data: z.array(legacyCategory).nullable()}),
      );
    },
  );
}
