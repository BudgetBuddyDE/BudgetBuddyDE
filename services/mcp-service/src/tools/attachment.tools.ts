import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {TAttachment} from '@budgetbuddyde/api/types';
import {z} from 'zod';
import {api, getApiRequestConfig} from '../lib/api';
import {err, ok} from './helpers';

export function registerAttachmentTools(server: McpServer): void {
  server.tool(
    'get_attachment',
    'Retrieve a single attachment by ID (returns the attachment metadata and a signed URL)',
    {
      id: z.string().uuid().describe('Attachment UUID (v7)'),
      ttl: z.number().min(60).max(3600).optional().describe('Signed URL TTL in seconds (60–3600, default: 900)'),
    },
    async ({id, ttl}) => {
      const [result, error] = await api.backend.attachment.getById(
        id as TAttachment['id'],
        {ttl: ttl as never},
        getApiRequestConfig(),
      );
      if (error) return err(error);
      return ok(result);
    },
  );

  server.tool(
    'list_transaction_attachments',
    'List attachments for a specific transaction',
    {
      transactionId: z.string().uuid().describe('Transaction UUID'),
      from: z.number().optional().describe('Offset for pagination'),
      to: z.number().optional().describe('Limit for pagination'),
    },
    async ({transactionId, ...query}) => {
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
