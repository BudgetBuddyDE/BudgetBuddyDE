import {buildConsoleFormat, LevelConfig} from '@budgetbuddyde/logger';
import type {NextFunction, Request, Response} from 'express';
import {createLogger, format, transports} from 'winston';
import {config} from '../config';
import {extractRequestAuth} from '../lib/requestAuth';

export const logger = createLogger({
  levels: LevelConfig.levels,
  level: config.logLevel,
  defaultMeta: {service: config.service, version: config.version},
  format: format.combine(
    format.timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
    format.splat(),
    format.colorize({level: config.runtime === 'development', colors: LevelConfig.colors}),
    buildConsoleFormat(config.service),
  ),
  transports: [new transports.Console()],
});

export function logRequest(req: Request, res: Response, next: NextFunction): void {
  const startedAt = Date.now();
  const requestAuth = extractRequestAuth(req);
  const action = getAction(req);

  logger.info('Request started', {
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
    if (status >= 500) logger.error(msg, meta);
    else if (status >= 400) logger.warn(msg, meta);
    else logger.info(msg, meta);
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
