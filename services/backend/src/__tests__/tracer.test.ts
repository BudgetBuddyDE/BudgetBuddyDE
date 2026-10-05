import {SpanKind} from '@opentelemetry/api';
import {SamplingDecision} from '@opentelemetry/sdk-trace';
import {ATTR_HTTP_ROUTE, ATTR_SERVICE_NAME} from '@opentelemetry/semantic-conventions';
import {setupTracing} from '../tracer';

const {getTracer, exporter, processor, providerOptions, provider, instrumentations, resource, parentSample} =
  vi.hoisted(() => ({
    getTracer: vi.fn(),
    exporter: vi.fn(),
    processor: vi.fn(),
    providerOptions: vi.fn(),
    provider: {register: vi.fn(), shutdown: vi.fn()},
    instrumentations: vi.fn(),
    resource: vi.fn(value => value),
    parentSample: vi.fn(),
  }));
vi.mock('@opentelemetry/api', async importOriginal => ({
  ...(await importOriginal<typeof import('@opentelemetry/api')>()),
  trace: {getTracer},
}));
vi.mock('@opentelemetry/exporter-trace-otlp-proto', () => ({
  OTLPTraceExporter: class {
    constructor(options: unknown) {
      exporter(options);
    }
  },
}));
vi.mock('@opentelemetry/resources', () => ({resourceFromAttributes: resource}));
vi.mock('@opentelemetry/sdk-trace-node', () => ({
  NodeTracerProvider: class {
    constructor(options: unknown) {
      providerOptions(options);
      return provider;
    }
  },
}));
vi.mock('@opentelemetry/instrumentation', () => ({registerInstrumentations: instrumentations}));
vi.mock('@opentelemetry/instrumentation-http', () => ({HttpInstrumentation: class {}}));
vi.mock('@opentelemetry/instrumentation-express', () => ({ExpressInstrumentation: class {}}));
vi.mock('@opentelemetry/sdk-trace', async importOriginal => ({
  ...(await importOriginal<typeof import('@opentelemetry/sdk-trace')>()),
  BatchSpanProcessor: class {
    constructor(options: unknown) {
      processor(options);
    }
  },
  AlwaysOnSampler: class {
    shouldSample = parentSample;
    toString() {
      return 'AlwaysOnSampler';
    }
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  provider.shutdown.mockResolvedValue(undefined);
  parentSample.mockReturnValue({decision: SamplingDecision.RECORD_AND_SAMPLED});
});
afterEach(() => vi.restoreAllMocks());
it('registers HTTP and Express instrumentation and flushes on shutdown', async () => {
  let beforeExit: (() => Promise<void>) | undefined;
  const originalOnce = process.once.bind(process);
  vi.spyOn(process, 'once').mockImplementation(((event: string, callback: (...args: unknown[]) => void) => {
    if (event === 'beforeExit') {
      beforeExit = callback as () => Promise<void>;
      return process;
    }
    return originalOnce(event, callback);
  }) as typeof process.once);
  getTracer.mockReturnValueOnce({name: 'tracer'});
  expect(setupTracing('backend')).toEqual({name: 'tracer'});
  expect(resource).toHaveBeenCalledWith({[ATTR_SERVICE_NAME]: 'backend'});
  expect(instrumentations).toHaveBeenCalledWith({
    tracerProvider: provider,
    instrumentations: [expect.anything(), expect.anything()],
  });
  expect(provider.register).toHaveBeenCalledOnce();
  await beforeExit!();
  expect(provider.shutdown).toHaveBeenCalledOnce();
});
it('suppresses server health spans while sampling other routes and client calls', () => {
  vi.spyOn(process, 'once').mockReturnValue(process);
  setupTracing('backend');
  const sampler = providerOptions.mock.calls[0][0].sampler;
  expect(sampler.toString()).toBe('FilterSampler(AlwaysOnSampler)');
  expect(sampler.shouldSample(null, 'trace', 'health', SpanKind.SERVER, {[ATTR_HTTP_ROUTE]: '/health'}, [])).toEqual({
    decision: SamplingDecision.NOT_RECORD,
  });
  expect(parentSample).not.toHaveBeenCalled();
  expect(sampler.shouldSample(null, 'trace', 'api', SpanKind.SERVER, {[ATTR_HTTP_ROUTE]: '/api/category'}, [])).toEqual(
    {decision: SamplingDecision.RECORD_AND_SAMPLED},
  );
  expect(
    sampler.shouldSample(null, 'trace', 'health-client', SpanKind.CLIENT, {[ATTR_HTTP_ROUTE]: '/health'}, []),
  ).toEqual({decision: SamplingDecision.RECORD_AND_SAMPLED});
  expect(parentSample).toHaveBeenCalledTimes(2);
});
it('initializes instrumentation with the configured service name', async () => {
  vi.resetModules();
  const setup = vi.fn();
  vi.doMock('../tracer', () => ({setupTracing: setup}));
  vi.doMock('../config', () => ({config: {service: 'backend-unit'}}));
  await import('../instrumentation');
  expect(setup).toHaveBeenCalledWith('backend-unit');
  vi.doUnmock('../tracer');
  vi.doUnmock('../config');
});
