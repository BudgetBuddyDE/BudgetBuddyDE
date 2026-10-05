import type {Server} from 'node:http';
import type {AddressInfo} from 'node:net';
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {StreamableHTTPServerTransport} from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import cors from 'cors';
import express from 'express';
import {z} from 'zod';
import {extractApiKey} from './authentication';

const mocks = vi.hoisted(() => ({
  config: {
    service: 'backend',
    version: '1.0',
    redis: {url: undefined as string | undefined},
    auth: {trustedOrigins: ['http://localhost:3000']},
    mcp: {rateLimit: {enabled: false, windowMs: 60_000, limit: 2}},
  },
  redisCall: vi.fn(),
  getSession: vi.fn(),
  logger: {error: vi.fn()},
}));
vi.mock('../config', () => ({config: mocks.config}));
vi.mock('../auth', () => ({auth: {api: {getSession: mocks.getSession}}}));
vi.mock('../lib/logger', () => ({logger: mocks.logger}));
vi.mock('../db/redis', () => ({getRedisClient: () => ({call: mocks.redisCall})}));
vi.mock('./tools', () => ({
  registerAllTools: (server: McpServer, userId: string) => {
    server.registerTool('owner', {inputSchema: {delay: z.number().optional()}}, async ({delay}) => {
      if (delay) await new Promise(resolve => setTimeout(resolve, delay));
      return {content: [{type: 'text', text: userId}]};
    });
  },
}));
import {closeMcpServers, createMcpRouter, validateMcpOrigin} from './router';

let server: Server;
let base: string;
beforeEach(async () => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  mocks.config.mcp.rateLimit.enabled = false;
  mocks.config.redis.url = undefined;
  mocks.redisCall.mockImplementation(async (command: string) => (command === 'SCRIPT' ? 'sha' : [1, 60_000]));
  mocks.getSession.mockImplementation(async ({headers}: {headers: Headers}) => {
    const key = headers.get('x-api-key');
    return key === 'invalid' ? null : {user: {id: key}};
  });
});
afterEach(async () => {
  await closeMcpServers();
  if (server)
    await new Promise<void>(resolve => {
      server.closeAllConnections();
      server.close(() => resolve());
    });
});
async function start() {
  const app = express();
  app.use('/mcp', validateMcpOrigin);
  app.use(cors({origin: mocks.config.auth.trustedOrigins}));
  app.use('/mcp', createMcpRouter());
  app.get('/api/domain', (_req, res) => res.json({domain: true}));
  server = app.listen(0);
  await new Promise<void>(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}
function request(body: unknown, headers: Record<string, string> = {'x-api-key': 'alice'}) {
  return fetch(`${base}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}
function rpc(method: string, params?: unknown, id = 1) {
  return {jsonrpc: '2.0', id, method, ...(params ? {params} : {})};
}
async function result(response: Response) {
  const text = await response.text();
  return JSON.parse(text.startsWith('event:') ? text.split('data: ')[1].trim() : text);
}

it('preserves both header forms and precedence without accepting cookies', () => {
  expect(extractApiKey({headers: {'x-api-key': ['primary'], authorization: 'Bearer secondary'}})).toBe('primary');
  expect(extractApiKey({headers: {authorization: 'bEaReR secret'}})).toBe('secret');
  expect(extractApiKey({headers: {cookie: 'session=secret'}})).toBeUndefined();
  expect(extractApiKey({headers: {authorization: 'Basic secret'}})).toBeUndefined();
  expect(extractApiKey({headers: {authorization: 'Bearer secret extra'}})).toBeUndefined();
});
it('initializes the real stateless SDK and lists tools', async () => {
  await start();
  const init = await request(
    rpc('initialize', {protocolVersion: '2025-11-25', capabilities: {}, clientInfo: {name: 'unit', version: '1'}}),
  );
  expect(init.status).toBe(200);
  expect(init.headers.get('mcp-session-id')).toBeNull();
  expect((await result(init)).result.serverInfo.name).toBe('@budgetbuddyde/mcp');
  const list = await request(rpc('tools/list'));
  expect((await result(list)).result.tools[0].name).toBe('owner');
  expect(mocks.getSession).toHaveBeenCalledTimes(2);
});
it('keeps concurrently authenticated owners isolated', async () => {
  await start();
  const responses = await Promise.all([
    request(rpc('tools/call', {name: 'owner', arguments: {delay: 20}}), {'x-api-key': 'alice'}),
    request(rpc('tools/call', {name: 'owner', arguments: {}}), {Authorization: 'Bearer bob'}),
  ]);
  const results = await Promise.all(responses.map(result));
  expect(results.map(value => value.result.content[0].text)).toEqual(['alice', 'bob']);
  expect(mocks.getSession).toHaveBeenCalledTimes(2);
});
it.each([{}, {cookie: 'session=valid'}, {'x-api-key': 'invalid'}])(
  'rejects missing or invalid keys %j before initialize',
  async headers => {
    await start();
    expect((await request(rpc('tools/list'), headers as Record<string, string>)).status).toBe(401);
  },
);
it.each([401, 403])('maps rejected/expired credentials (%s) to generic 401', async statusCode => {
  await start();
  mocks.getSession.mockRejectedValue({statusCode, message: 'secret'});
  const response = await request(rpc('tools/list'));
  expect(response.status).toBe(401);
  expect(await response.text()).not.toContain('secret');
});
it('preserves API-key quota errors', async () => {
  await start();
  mocks.getSession.mockRejectedValue({statusCode: 401, body: {code: 'RATE_LIMITED'}});
  expect((await request(rpc('tools/list'))).status).toBe(429);
});
it('hides unexpected authentication failures', async () => {
  await start();
  mocks.getSession.mockRejectedValue(new Error('database credential'));
  const response = await request(rpc('tools/list'));
  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({error: 'Authentication failed'});
});
it('checks origins before authentication and permits configured origins', async () => {
  await start();
  expect((await request(rpc('tools/list'), {Origin: 'https://foreign.example'})).status).toBe(403);
  expect(mocks.getSession).not.toHaveBeenCalled();
  expect((await request(rpc('tools/list'), {Origin: 'http://localhost:3000', 'x-api-key': 'alice'})).status).toBe(200);
});
it('limits only MCP independently of domain endpoints', async () => {
  mocks.config.mcp.rateLimit.enabled = true;
  await start();
  expect((await request(rpc('tools/list'))).status).toBe(200);
  expect((await request(rpc('tools/list'))).status).toBe(200);
  const response = await request(rpc('tools/list'));
  expect(response.status).toBe(429);
  expect(response.headers.get('retry-after')).toBeTruthy();
  expect(mocks.getSession).toHaveBeenCalledTimes(2);
  expect((await fetch(`${base}/api/domain`)).status).toBe(200);
});
it('returns parse errors without exposing internals', async () => {
  await start();
  const response = await fetch(`${base}/mcp`, {
    method: 'POST',
    headers: {'x-api-key': 'alice', 'Content-Type': 'application/json'},
    body: '{broken',
  });
  expect(response.status).toBe(400);
  expect((await response.json()).error.code).toBe(-32700);
});
it('preserves SDK DELETE, unsupported-method, accept and notification behavior', async () => {
  await start();
  expect((await fetch(`${base}/mcp`, {method: 'DELETE', headers: {'x-api-key': 'alice'}})).status).toBe(200);
  expect((await fetch(`${base}/mcp`, {method: 'PUT', headers: {'x-api-key': 'alice'}})).status).toBe(405);
  expect((await fetch(`${base}/mcp`, {headers: {'x-api-key': 'alice'}})).status).toBe(406);
  expect((await request({jsonrpc: '2.0', method: 'notifications/initialized'})).status).toBe(202);
  expect((await request({invalid: 'payload'})).status).toBe(400);
});
it('closes the transport on connection failures', async () => {
  await start();
  vi.spyOn(McpServer.prototype, 'connect').mockRejectedValueOnce(new Error('secret'));
  const close = vi.spyOn(McpServer.prototype, 'close');
  const response = await request(rpc('tools/list'));
  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({error: 'Internal Server Error'});
  expect(close).toHaveBeenCalledOnce();
});
it('closes failed handlers and can shut down active SSE connections', async () => {
  await start();
  vi.spyOn(StreamableHTTPServerTransport.prototype, 'handleRequest').mockRejectedValueOnce(new Error('secret'));
  const close = vi.spyOn(McpServer.prototype, 'close');
  expect((await request(rpc('tools/list'))).status).toBe(500);
  expect(close).toHaveBeenCalledOnce();
  const stream = await fetch(`${base}/mcp`, {headers: {'x-api-key': 'alice', Accept: 'text/event-stream'}});
  expect(stream.status).toBe(200);
  await closeMcpServers();
  await stream.text();
});
it('does not send MCP subpaths through domain middleware', async () => {
  await start();
  expect((await fetch(`${base}/mcp/unknown`, {headers: {'x-api-key': 'alice'}})).status).toBe(404);
});

it('rejects foreign preflight origins before CORS and permits trusted preflights', async () => {
  await start();
  const headers = {Origin: 'https://foreign.example', 'Access-Control-Request-Method': 'POST'};
  expect((await fetch(`${base}/mcp`, {method: 'OPTIONS', headers})).status).toBe(403);
  headers.Origin = 'http://localhost:3000';
  expect((await fetch(`${base}/mcp`, {method: 'OPTIONS', headers})).status).toBe(204);
  expect(mocks.getSession).not.toHaveBeenCalled();
});
it('uses the independent Redis limiter when available', async () => {
  mocks.config.mcp.rateLimit.enabled = true;
  mocks.config.redis.url = 'redis://unit';
  await start();
  expect((await request(rpc('tools/list'))).status).toBe(200);
  expect(mocks.redisCall).toHaveBeenCalledWith('EVALSHA', 'sha', '1', expect.stringContaining('mcp:'), '0', '60000');
});
it('returns 413 for oversized requests', async () => {
  await start();
  expect((await request({large: 'x'.repeat(110_000)})).status).toBe(413);
});
it('refuses new MCP processing once shutdown begins', async () => {
  await start();
  await closeMcpServers();
  expect((await request(rpc('tools/list'))).status).toBe(503);
});
