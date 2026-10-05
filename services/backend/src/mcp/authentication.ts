import type {Request} from 'express';

/** Bearer remains an alias for an API key; browser cookies are never used here. */
export function extractApiKey(req: Pick<Request, 'headers'>): string | undefined {
  const value = (header: string | string[] | undefined) => (Array.isArray(header) ? header[0] : header)?.trim();
  const apiKey = value(req.headers['x-api-key']);
  if (apiKey) return apiKey;
  const match = /^Bearer\s+(\S+)$/i.exec(value(req.headers.authorization) ?? '');
  return match?.[1];
}
