import type {NextFunction, Request, Response} from 'express';
import {config} from '../config';

/**
 * Middleware that enforces API key authentication when `MCP_API_KEY` is configured.
 * Requests missing or carrying the wrong key receive a 401.
 */
export function apiKeyMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!config.mcpApiKey) {
    next();
    return;
  }

  const provided = req.headers['x-api-key'];
  if (!provided || provided !== config.mcpApiKey) {
    res.status(401).json({error: 'Unauthorized – invalid or missing API key'});
    return;
  }

  next();
}
