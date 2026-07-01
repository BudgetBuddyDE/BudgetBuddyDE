import {PaymentMethod, CreateOrUpdatePaymentMethodPayload} from '@budgetbuddyde/api/schemas';
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {z} from 'zod';
import {err, ok} from './helpers';
import {api, getApiRequestConfig} from '../lib/api';

export function registerPaymentMethodTools(server: McpServer): void {
  server.registerTool(
    'list_payment_methods',
    {
      description: 'List all payment methods for the authenticated user',
      inputSchema: {
        from: z.number().optional().describe('Offset for pagination'),
        to: z.number().optional().describe('Limit for pagination'),
        search: z.string().optional().describe('Search term'),
      },
    },
    async (params, _extra) => {
      const [result, error] = await api.backend.paymentMethod.getAll(params, getApiRequestConfig());
      if (error) return err(error);
      return ok(result);
    },
  );

  server.registerTool(
    'get_payment_method',
    {
      description: 'Get a single payment method by ID',
      inputSchema: {
        id: PaymentMethod.shape.id.describe('Payment method UUID'),
      },
    },
    async ({id}, _extra) => {
      const [result, error] = await api.backend.paymentMethod.getById(id, getApiRequestConfig());
      if (error) return err(error);
      return ok(result);
    },
  );

  server.registerTool(
    'create_payment_method',
    {
      description: 'Create a new payment method',
      inputSchema: CreateOrUpdatePaymentMethodPayload,
    },
    async (payload, _extra) => {
      const [result, error] = await api.backend.paymentMethod.create(payload, getApiRequestConfig());
      if (error) return err(error);
      return ok(result);
    },
  );

  server.registerTool(
    'update_payment_method',
    {
      description: 'Update an existing payment method',
      inputSchema: CreateOrUpdatePaymentMethodPayload.partial().extend({
        id: PaymentMethod.shape.id.describe('Payment method UUID'),
      }),
    },
    async ({id, ...payload}, _extra) => {
      const [result, error] = await api.backend.paymentMethod.updateById(id, payload, getApiRequestConfig());
      if (error) return err(error);
      return ok(result);
    },
  );

  server.registerTool(
    'delete_payment_method',
    {
      description: 'Delete a payment method by ID',
      inputSchema: {
        id: PaymentMethod.shape.id.describe('Payment method UUID'),
      },
    },
    async ({id}, _extra) => {
      const [result, error] = await api.backend.paymentMethod.deleteById(id, getApiRequestConfig());
      if (error) return err(error);
      return ok(result);
    },
  );
}
