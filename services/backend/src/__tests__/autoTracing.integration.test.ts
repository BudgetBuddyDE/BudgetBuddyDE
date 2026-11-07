import {execFileSync} from 'node:child_process';

it('creates a connected HTTP trace with automatic instrumentation before modules load', () => {
  const script = String.raw`
    const {setupTracing, shutdownTracing} = require('./src/tracer.ts');
    const recorded = [];
    const exporter = {
      export(spans, callback) { recorded.push(...spans); callback({code: 0}); },
      shutdown() { return Promise.resolve(); },
    };
    setupTracing('test-backend', exporter);
    const http = require('node:http');
    const express = require('express');
    const app = express();
    app.get('/health', (_, res) => res.end('ok'));
    app.get('/api/probe', (_, res) => res.end('ok'));
    const server = app.listen(0, '127.0.0.1', async () => {
      const port = server.address().port;
      const request = path => new Promise((resolve, reject) => {
        http.get({host: '127.0.0.1', port, path}, res => { res.resume(); res.on('end', resolve); }).on('error', reject);
      });
      await request('/api/probe?token=secret');
      await request('/health');
      await require('@opentelemetry/api').trace.getTracer('probe').startActiveSpan('probe', async span => {
      const {Client} = require('pg');
      const client = new Client({host: '127.0.0.1', port: 1, user: 'tester', database: 'test', connectionTimeoutMillis: 500});
      try { await client.connect(); } catch {}
      try { await client.query("SELECT 'secret'"); } catch {}
      try { await client.end(); } catch {}
      const Redis = require('ioredis');
      const redis = new Redis({host: '127.0.0.1', port: 1, lazyConnect: true, enableOfflineQueue: false, retryStrategy: () => null});
      redis.on('error', () => {});
      try { await redis.get('secret'); } catch {}
      redis.disconnect();
      span.end();
      });
      server.close(async () => {
        await shutdownTracing();
        process.stdout.write(JSON.stringify(recorded.map(span => ({name: span.name, kind: span.kind, attributes: span.attributes, traceId: span.spanContext().traceId, parent: span.parentSpanContext?.spanId, id: span.spanContext().spanId}))));
      });
    });
  `;
  const output = execFileSync(process.execPath, ['--require', require.resolve('tsx/cjs'), '-e', script], {
    cwd: process.cwd(),
    env: {...process.env, OTEL_SDK_DISABLED: 'false', OTEL_TRACES_EXPORTER: 'otlp', OTEL_TRACES_SAMPLER: 'always_on'},
    encoding: 'utf8',
    timeout: 20000,
  });
  const spans = JSON.parse(output) as {
    name: string;
    kind: number;
    traceId: string;
    parent?: string;
    id: string;
    attributes: Record<string, unknown>;
  }[];
  const incoming = spans.find(span => span.name === 'http.server');
  const outgoing = spans.find(span => span.name === 'http.client' && span.traceId === incoming?.traceId);
  expect(incoming).toBeDefined();
  expect(outgoing).toBeDefined();
  expect(incoming?.parent).toBe(outgoing?.id);
  expect(spans.filter(span => span.name === 'http.server')).toHaveLength(1);
  expect(spans.some(span => span.name === 'postgresql.operation')).toBe(true);
  expect(
    spans.some(span => span.name === 'postgresql.operation' && span.attributes['db.operation.name'] === 'SELECT'),
  ).toBe(true);
  expect(spans.some(span => span.name === 'redis.operation')).toBe(true);
  expect(JSON.stringify(spans)).not.toContain('secret');

  const unsampled = execFileSync(process.execPath, ['--require', require.resolve('tsx/cjs'), '-e', script], {
    cwd: process.cwd(),
    env: {...process.env, OTEL_SDK_DISABLED: 'false', OTEL_TRACES_EXPORTER: 'otlp', OTEL_TRACES_SAMPLER: 'always_off'},
    encoding: 'utf8',
    timeout: 20000,
  });
  expect(JSON.parse(unsampled)).toEqual([]);
}, 30000);
