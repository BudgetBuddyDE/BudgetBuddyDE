import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {z} from 'zod';
import {api, getApiRequestConfig} from '../lib/api';
import {err, ok} from './helpers';

export function registerPaymentMethodTools(server: McpServer): void {
  server.tool('list_payment_methods', 'List all payment methods for the authenticated user', {
    from: z.number().optional().describe('Offset for pagination'),
    to: z.number().optional().describe('Limit for pagination'),
    search: z.string().optional().describe('Search term'),
  }, async (params) => {
    const [result, error] = await api.backend.paymentMethod.getAll(params, getApiRequestConfig());
    if (error) return err(error);
    return ok(result);
  });

  server.tool('get_payment_method', 'Get a single payment method by ID', {
    id: z.string().uuid().describe('Payment method UUID'),
  }, async ({id}) => {
    const [result, error] = await api.backend.paymentMethod.getById(id, getApiRequestConfig());
    if (error) return err(error);
    return ok(result);
  });

  server.tool(
    'create_payment_method',
    'Create a new payment method',
    {
      name: z.string().describe('Display name'),
      provider: z.string().min(1).max(100).describe('Provider name (e.g. Visa, Mastercard)'),
      address: z.string().min(1).max(100).describe('Account address or card number (last 4 digits)'),
      description: z.string().optional().describe('Optional description'),
    },
    async (payload) => {
      const [result, error] = await api.backend.paymentMethod.create(payload, getApiRequestConfig());
      if (error) return err(error);
      return ok(result);
    },
  );

  server.tool(
    'update_payment_method',
    'Update an existing payment method',
    {
      id: z.string().uuid().describe('Payment method UUID'),
      name: z.string().optional(),
      provider: z.string().min(1).max(100).optional(),
      address: z.string().min(1).max(100).optional(),
      description: z.string().optional(),
    },
    async ({id, ...payload}) => {
      const [result, error] = await api.backend.paymentMethod.updateById(id, payload, getApiRequestConfig());
      if (error) return err(error);
      return ok(result);
    },
  );

  server.tool('delete_payment_method', 'Delete a payment method by ID', {
    id: z.string().uuid().describe('Payment method UUID'),
  }, async ({id}) => {
    const [result, error] = await api.backend.paymentMethod.deleteById(id, getApiRequestConfig());
    if (error) return err(error);
    return ok(result);
  });
}
