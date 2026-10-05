import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {StreamableHTTPServerTransport} from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express, {Router, type ErrorRequestHandler, type RequestHandler} from 'express';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import {auth} from '../auth';
import {config} from '../config';
import {extractApiKey} from './authentication';
import {registerAllTools} from './tools';
import {getRedisClient} from '../db/redis';
import {logger} from '../lib/logger';

const activeServers = new Set<() => Promise<void>>();
let stopping = false;

export async function closeMcpServers(): Promise<void> {
  stopping = true;
  await Promise.allSettled([...activeServers].map(close => close()));
  activeServers.clear();
}

export const validateMcpOrigin: RequestHandler = (req, res, next) => {
  const origin = req.headers.origin;
  if (origin !== undefined && !config.auth.trustedOrigins.includes(origin)) {
    res.status(403).json({error: 'Forbidden origin'});
    return;
  }
  next();
};

export function createMcpRouter(): Router {
  stopping = false;
  const router = Router();
  router.use(validateMcpOrigin);
  if (config.mcp.rateLimit.enabled) {
    router.use(
      rateLimit({
        windowMs: config.mcp.rateLimit.windowMs,
        limit: config.mcp.rateLimit.limit,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        ...(config.redis.url
          ? {
              store: new RedisStore({
                prefix: `rate-limit:${config.service}:mcp:`,
                // Redis replies are checked by the rate-limit store.
                sendCommand: (...args: string[]) => getRedisClient().call(...(args as [string, ...string[]])) as never,
              }),
            }
          : {}),
        passOnStoreError: false,
        handler: (_req, res) => {
          res.status(429).json({error: 'Too many requests. Please try again later.'});
        },
      }),
    );
  }
  router.use(async (req, res, next) => {
    const key = extractApiKey(req);
    if (!key) {
      res.status(401).json({error: 'Unauthorized'});
      return;
    }
    try {
      const session = await auth.api.getSession({headers: new Headers({'x-api-key': key})});
      if (!session?.user?.id) {
        res.status(401).json({error: 'Unauthorized'});
        return;
      }
      res.locals.mcpUserId = session.user.id;
      next();
    } catch (error) {
      const failure = (error ?? {}) as {statusCode?: number; body?: {code?: string}};
      if (failure.body?.code === 'RATE_LIMITED' || failure.statusCode === 429) {
        res.status(429).json({error: 'Too many requests. Please try again later.'});
      } else if (failure.statusCode === 401 || failure.statusCode === 403) {
        res.status(401).json({error: 'Unauthorized'});
      } else {
        logger.error('MCP authentication failed');
        res.status(503).json({error: 'Authentication failed'});
      }
    }
  });
  router.use(express.json());
  router.all('/', async (req, res) => {
    if (stopping) {
      res.status(503).json({error: 'Service unavailable'});
      return;
    }
    const server = new McpServer({name: '@budgetbuddyde/mcp', version: config.version});
    const transport = new StreamableHTTPServerTransport({sessionIdGenerator: undefined});
    let closing: Promise<void> | undefined;
    const close = () => (closing ??= server.close().finally(() => activeServers.delete(close)));
    activeServers.add(close);
    const onClose = () => {
      void close().catch(() => logger.error('MCP cleanup failed'));
    };
    req.once('aborted', onClose);
    res.once('close', onClose);
    try {
      registerAllTools(server, res.locals.mcpUserId as string);
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } finally {
      await close();
      req.off('aborted', onClose);
      res.off('close', onClose);
    }
  });
  router.use((_req, res) => {
    res.status(404).json({error: 'Not Found'});
  });
  const handleError: ErrorRequestHandler = (error, _req, res, _next) => {
    if (res.headersSent) {
      res.end();
      return;
    }
    if (error.type === 'entity.too.large') {
      res.status(413).json({error: 'Request body too large'});
    } else if (error.type === 'entity.parse.failed') {
      res.status(400).json({jsonrpc: '2.0', error: {code: -32700, message: 'Parse error'}, id: null});
    } else {
      logger.error('MCP request failed');
      res.status(500).json({error: 'Internal Server Error'});
    }
  };
  router.use(handleError);
  return router;
}
