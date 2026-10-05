import {PaymentMethod, CreateOrUpdatePaymentMethodPayload} from '@budgetbuddyde/api/schemas';
import * as responses from '@budgetbuddyde/api/schemas';
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {z} from 'zod';
import {callTool} from './helpers';
import * as domain from '../../domain/paymentMethod';

export function registerPaymentMethodTools(server: McpServer, userId: string): void {
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
      return callTool(() => domain.list(userId, params), responses.GetAllPaymentMethodsResponse);
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
      return callTool(() => domain.get(userId, id), responses.GetPaymentMethodResponse);
    },
  );

  server.registerTool(
    'create_payment_method',
    {
      description: 'Create a new payment method',
      inputSchema: CreateOrUpdatePaymentMethodPayload,
    },
    async (payload, _extra) => {
      return callTool(() => domain.create(userId, payload), responses.CreatePaymentMethodResponse);
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
      return callTool(() => domain.update(userId, id, payload), responses.UpdatePaymentMethodResponse);
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
      return callTool(() => domain.remove(userId, id), responses.DeletePaymentMethodResponse);
    },
  );
}
