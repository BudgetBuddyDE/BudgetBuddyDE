import type {TAttachment} from '@budgetbuddyde/api/types';
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {z} from 'zod';
import {err, ok} from './helpers';
import {api, getApiRequestConfig} from '../lib/api';

export function registerAttachmentTools(server: McpServer): void {
  server.registerTool(
    'get_attachment',
    {
      description: 'Retrieve a single attachment by ID (returns the attachment metadata and a signed URL)',
      inputSchema: {
        id: z.string().uuid().describe('Attachment UUID (v7)'),
        ttl: z.number().min(60).max(3600).optional().describe('Signed URL TTL in seconds (60–3600, default: 900)'),
      },
    },
    async ({id, ttl}, _extra) => {
      const [result, error] = await api.backend.attachment.getById(
        id as TAttachment['id'],
        {ttl: ttl as never},
        getApiRequestConfig(),
      );
      if (error) return err(error);
      return ok(result);
    },
  );

  server.registerTool(
    'list_transaction_attachments',
    {
      description: 'List attachments for a specific transaction',
      inputSchema: {
        transactionId: z.string().uuid().describe('Transaction UUID'),
        from: z.number().optional().describe('Offset for pagination'),
        to: z.number().optional().describe('Limit for pagination'),
      },
    },
    async ({transactionId, ...query}, _extra) => {
      const [result, error] = await api.backend.transaction.getTransactionAttachments(
        transactionId,
        query,
        getApiRequestConfig(),
      );
      if (error) return err(error);
      return ok(result);
    },
  );
}
