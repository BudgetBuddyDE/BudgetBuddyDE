import {STATUS_CODES} from 'node:http';
import {BackendError} from '@budgetbuddyde/core/error/BackendError';
import type {CallToolResult} from '@modelcontextprotocol/sdk/types.js';
import {ZodError, type ZodType} from 'zod';
import {normalizeResponse} from '../../domain/response';
import type {ApiResponse} from '../../models';

/**
 * Wraps a value as an MCP text content result.
 */
export function ok(data: unknown): CallToolResult {
  return {content: [{type: 'text', text: JSON.stringify(data, null, 2)}]};
}

/**
 * Wraps an error as an MCP error result.
 */
export function err(error: unknown): CallToolResult {
  const message = error instanceof Error ? error.message : String(error);
  return {isError: true, content: [{type: 'text', text: `Error: ${message}`}]};
}

/** Preserve the public API response validation and MCP error contract without HTTP. */
export async function callTool(
  operation: () => Promise<ApiResponse<unknown>>,
  schema: ZodType,
): Promise<CallToolResult> {
  try {
    const result = normalizeResponse(await operation());
    if (result.status < 200 || result.status >= 300) {
      return err(new BackendError(result.status, STATUS_CODES[result.status] ?? 'Request failed'));
    }
    return ok(schema.parse(JSON.parse(JSON.stringify(result))));
  } catch (error) {
    return err(
      new BackendError(
        error instanceof ZodError ? 400 : 500,
        error instanceof ZodError ? 'Bad Request' : 'Internal Server Error',
      ),
    );
  }
}
