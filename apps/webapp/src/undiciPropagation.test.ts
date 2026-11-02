// @vitest-environment node

import {createServer} from 'node:http';
import {context, propagation, ROOT_CONTEXT, trace} from '@opentelemetry/api';
import {AsyncLocalStorageContextManager} from '@opentelemetry/context-async-hooks';
import {registerInstrumentations} from '@opentelemetry/instrumentation';
import {UndiciInstrumentation} from '@opentelemetry/instrumentation-undici';
import {InMemorySpanExporter, SimpleSpanProcessor} from '@opentelemetry/sdk-trace';
import {NodeTracerProvider} from '@opentelemetry/sdk-trace-node';

Object.assign(globalThis, {document: {documentElement: {lang: '', dataset: {}}}});

it('sends the active client span context through native fetch', async () => {
  const exporter = new InMemorySpanExporter();
  const provider = new NodeTracerProvider({spanProcessors: [new SimpleSpanProcessor({exporter})]});
  provider.register({contextManager: new AsyncLocalStorageContextManager().enable()});
  const instrumentation = new UndiciInstrumentation();
  registerInstrumentations({tracerProvider: provider, instrumentations: [instrumentation]});

  let receivedTraceparent: string | undefined;
  const server = createServer((request, response) => {
    const traceparent = request.headers.traceparent;
    receivedTraceparent = Array.isArray(traceparent) ? traceparent[0] : traceparent;
    response.end('ok');
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));

  try {
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Expected an ephemeral TCP port');

    const parent = trace.getTracer('webapp-test').startSpan('next-fetch');
    const parentContext = trace.setSpan(context.active(), parent);
    await context.with(parentContext, () => fetch(`http://127.0.0.1:${address.port}/api/test`));
    parent.end();
    await provider.forceFlush();

    expect(receivedTraceparent).toMatch(/^00-[\da-f]{32}-[\da-f]{16}-[\da-f]{2}$/);
    const extracted = propagation.extract(ROOT_CONTEXT, {traceparent: receivedTraceparent});
    const spans = exporter.getFinishedSpans();
    const client = spans.find(span => span.kind === 2);
    expect(client?.spanContext().traceId).toBe(trace.getSpan(extracted)?.spanContext().traceId);
    expect(trace.getSpan(extracted)?.spanContext().spanId).toBe(client?.spanContext().spanId);
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => (error ? reject(error) : resolve())));
    instrumentation.disable();
    await provider.shutdown();
  }
});
