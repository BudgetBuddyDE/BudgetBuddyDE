import {Attachment, SignedAttachmentUrlTTL} from '@budgetbuddyde/api/schemas';
import * as responses from '@budgetbuddyde/api/schemas';
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {z} from 'zod';
import {callTool} from './helpers';
import * as domain from '../../domain/attachment';
import {listTransactionAttachments} from '../../domain/transaction';

export function registerAttachmentTools(server: McpServer, userId: string): void {
  server.registerTool(
    'get_attachment',
    {
      description: 'Retrieve a single attachment by ID (returns the attachment metadata and a signed URL)',
      inputSchema: {
        id: Attachment.shape.id.describe('Attachment UUID (v7)'),
        ttl: SignedAttachmentUrlTTL.optional().describe('Signed URL TTL in seconds (60–3600, default: 900)'),
      },
    },
    async ({id, ttl}, _extra) => {
      return callTool(() => domain.getAttachment(userId, id, {ttl}), responses.GetAttachmentResponse);
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
      return callTool(
        () => listTransactionAttachments(userId, transactionId, query),
        responses.GetTransactionAttachmentsResponse,
      );
    },
  );
}
