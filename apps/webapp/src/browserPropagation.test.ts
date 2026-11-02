import {context, trace} from '@opentelemetry/api';
import {registerInstrumentations} from '@opentelemetry/instrumentation';
import {FetchInstrumentation} from '@opentelemetry/instrumentation-fetch';
import {WebTracerProvider} from '@opentelemetry/sdk-trace-web';
import {createBackendTraceUrlPattern} from './tracePropagation';

it('injects W3C headers only for matching backend requests', async () => {
  const originalFetch = globalThis.fetch;
  const calls: Array<{url: RequestInfo | URL; headers: Headers}> = [];
  globalThis.fetch = vi.fn(async (url: RequestInfo | URL, options?: RequestInit) => {
    calls.push({url, headers: new Headers(options?.headers)});
    return new Response('{}', {status: 200});
  }) as typeof fetch;
  const provider = new WebTracerProvider();
  provider.register();
  const instrumentation = new FetchInstrumentation({
    propagateTraceHeaderCorsUrls: [createBackendTraceUrlPattern('https://api.example.test')],
  });
  registerInstrumentations({tracerProvider: provider, instrumentations: [instrumentation]});

  try {
    const parent = trace.getTracer('browser-test').startSpan('ui-action');
    await context.with(trace.setSpan(context.active(), parent), async () => {
      await fetch('https://api.example.test/api/transactions');
      await fetch('https://api.example.test.evil/api/transactions');
    });
    parent.end();

    expect(calls[0].headers.get('traceparent')).toMatch(/^00-[\da-f]{32}-[\da-f]{16}-[\da-f]{2}$/);
    expect(calls[1].headers.has('traceparent')).toBe(false);
  } finally {
    instrumentation.disable();
    globalThis.fetch = originalFetch;
  }
});
