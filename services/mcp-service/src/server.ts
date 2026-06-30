#!/usr/bin/env node
import cors from 'cors';
import express from 'express';
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {StreamableHTTPServerTransport} from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {config} from './config';
import {apiKeyMiddleware, handleError, logRequest} from './middleware';
import {registerAllTools} from './tools';

export const app = express();
app.use(cors());
app.use(express.json());
app.use(logRequest);

// Health / status
app.get(/^\/(api\/)?(status|health)\/?$/, (_req, res) => {
  res.json({status: 'ok', service: config.service, version: config.version});
});

// MCP endpoint (stateless – each request gets its own transport)
app.all('/mcp', apiKeyMiddleware, async (req, res) => {
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

app.use(handleError);

export const server = app.listen(config.port, () => {
  const options = {
    'Application Name': config.service,
    'Application Version': config.version,
    'Runtime Environment': config.runtime,
    'Node Version': process.version,
    'Server Port': config.port,
    'Backend URL': config.backendUrl,
    'MCP API Key Protected': config.mcpApiKey !== null,
  };
  console.table(options);
});
