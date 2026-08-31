#!/usr/bin/env node
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {StreamableHTTPServerTransport} from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import cors from 'cors';
import express from 'express';
import {config} from './config';
import {getHealthStatus} from './lib/health';
import {logger} from './lib/logger';
import {runWithRequestAuthContext, type RequestAuthContext} from './lib/requestAuth';
import {apiKeyMiddleware, handleError, logRequest, rateLimitMiddleware} from './middleware';
import {registerAllTools} from './tools';

export const app = express();
app.use(cors());
app.use(express.json());
app.use(logRequest);
if (config.rateLimit.enabled) {
  app.use(rateLimitMiddleware);
  logger.info('Rate limiting is enabled.');
} else logger.warn('Rate limiting is disabled. Make sure to enable it in production to prevent abuse.');

// Health / status
app.all(/^\/(api\/)?(status|health)\/?$/, async (_req, res) => {
  const healthStatus = await getHealthStatus(config.backendUrl);
  res.status(healthStatus.status).json(healthStatus);
});

// MCP endpoint (stateless – each request gets its own transport)
app.all('/mcp', apiKeyMiddleware, async (req, res) => {
  const requestAuth = res.locals.requestAuth as RequestAuthContext | undefined;
  if (!requestAuth) {
    res.status(401).json({error: 'Unauthorized'});
    return;
  }

  await runWithRequestAuthContext(requestAuth, async () => {
    const server = new McpServer({name: config.service, version: config.version});
    registerAllTools(server);

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    await server.connect(transport);

    try {
      await transport.handleRequest(req, res, req.body);
    } finally {
      await server.close();
    }
  });
});

app.use(handleError);

export const server = app.listen(config.port, () => {
  logger.info('Service started', {
    port: config.port,
    backendUrl: config.backendUrl,
    nodeVersion: process.version,
    logLevel: config.log.level,
    authHeaders: ['Authorization', 'X-Api-Key'],
  });
});
