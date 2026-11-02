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
const {initializeLogging, shutdownLogging, shutdownTracing} = vi.hoisted(() => ({
  initializeLogging: vi.fn(),
  shutdownLogging: vi.fn().mockResolvedValue(undefined),
  shutdownTracing: vi.fn().mockResolvedValue(undefined),
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
vi.mock('@budgetbuddyde/logger/node', () => ({initializeLogging, shutdownLogging}));

let beforeExit: (() => void) | undefined;
let originalOnce: typeof process.once;

beforeEach(() => {
  vi.clearAllMocks();
  beforeExit = undefined;
  originalOnce = process.once;
  vi.spyOn(process, 'once').mockImplementation(((event: string | symbol, listener: (...args: any[]) => void) => {
    if (event === 'beforeExit') beforeExit = listener as () => void;
    else originalOnce.call(process, event, listener);
    return process;
  }) as typeof process.once);
  provider.shutdown.mockResolvedValue(undefined);
  shutdownLogging.mockResolvedValue(undefined);
  shutdownTracing.mockResolvedValue(undefined);
  parentSample.mockReturnValue({decision: SamplingDecision.RECORD_AND_SAMPLED});
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.doUnmock('../tracer');
  vi.doUnmock('@budgetbuddyde/logger/node');
  vi.resetModules();
});
it('registers HTTP and Express instrumentation without owning process shutdown', () => {
  const once = vi.spyOn(process, 'once').mockReturnValue(process);
  getTracer.mockReturnValueOnce({name: 'tracer'});
  expect(setupTracing('backend')).toEqual({name: 'tracer'});
  expect(resource).toHaveBeenCalledWith({[ATTR_SERVICE_NAME]: 'backend'});
  expect(instrumentations).toHaveBeenCalledWith({
    tracerProvider: provider,
    instrumentations: [expect.anything(), expect.anything()],
  });
  expect(provider.register).toHaveBeenCalledOnce();
  expect(once).not.toHaveBeenCalled();
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
  const initializeLogging = vi.fn();
  vi.stubEnv('OTEL_EXPORTER_OTLP_ENDPOINT', 'http://localhost:4318');
  vi.stubEnv('OTEL_SERVICE_NAME', 'backend-unit');
  vi.doMock('../tracer', () => ({setupTracing: setup, shutdownTracing}));
  vi.doMock('@budgetbuddyde/logger/node', () => ({initializeLogging, shutdownLogging}));
  await import('../instrumentation');
  expect(setup).toHaveBeenCalledWith('backend-unit');
  expect(initializeLogging).toHaveBeenCalledWith(expect.objectContaining({context: {service: 'backend-unit'}}));
  expect(beforeExit).toBeTypeOf('function');
  beforeExit?.();
  const {shutdownTelemetry} = await import('../telemetry');
  await shutdownTelemetry();
  expect(shutdownLogging).toHaveBeenCalledOnce();
  expect(shutdownTracing).toHaveBeenCalledOnce();
});

it('leaves export disabled without an endpoint', async () => {
  vi.resetModules();
  const setup = vi.fn();
  const initializeLogging = vi.fn();
  vi.stubEnv('OTEL_EXPORTER_OTLP_ENDPOINT', '');
  vi.doMock('../tracer', () => ({setupTracing: setup, shutdownTracing}));
  vi.doMock('@budgetbuddyde/logger/node', () => ({initializeLogging, shutdownLogging}));
  await import('../instrumentation');
  expect(setup).not.toHaveBeenCalled();
  expect(initializeLogging).toHaveBeenCalledOnce();
  expect(beforeExit).toBeTypeOf('function');
  beforeExit?.();
  const {shutdownTelemetry} = await import('../telemetry');
  await shutdownTelemetry();
  expect(shutdownLogging).toHaveBeenCalledOnce();
  expect(shutdownTracing).toHaveBeenCalledOnce();
});
