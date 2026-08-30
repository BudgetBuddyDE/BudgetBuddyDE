import type {NextFunction, Request, Response} from 'express';
import {logger} from '../lib/logger';
import {extractRequestAuth} from '../lib/requestAuth';

const requestLogger = logger.child({module: 'request'});

export function logRequest(req: Request, res: Response, next: NextFunction): void {
  const startedAt = Date.now();
  const requestAuth = extractRequestAuth(req);
  const action = getAction(req);

  requestLogger.info('Request started', {
    actor: requestAuth?.actor ?? 'anonymous',
    authMethod: requestAuth?.authMethod ?? 'none',
    action,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
  });

  res.on('finish', () => {
    const status = res.statusCode;
    const result = status >= 500 ? 'error' : status >= 400 ? 'rejected' : 'success';
    const msg = `Request completed (${result})`;
    const meta = {
      actor: requestAuth?.actor ?? 'anonymous',
      authMethod: requestAuth?.authMethod ?? 'none',
      action,
      method: req.method,
      url: req.originalUrl,
      status,
      result,
      durationMs: Date.now() - startedAt,
      ip: req.ip,
    };
    if (status >= 500) requestLogger.error(msg, meta);
    else if (status >= 400) requestLogger.warn(msg, meta);
    else requestLogger.info(msg, meta);
  });
  next();
}

function getAction(req: Request): string {
  if (req.originalUrl !== '/mcp') {
    return `${req.method} ${req.originalUrl}`;
  }

  const body = req.body as {method?: unknown; params?: {name?: unknown}} | undefined;
  if (!body?.method || typeof body.method !== 'string') {
    return `${req.method} /mcp`;
  }

  if (body.method === 'tools/call') {
    const toolName = body.params?.name;
    if (typeof toolName === 'string' && toolName.length > 0) {
      return `MCP tool call: ${toolName}`;
    }
  }

  return `MCP method: ${body.method}`;
}
