import {SpanKind} from '@opentelemetry/api';
import {setupTracing, shutdownTracing} from '../tracer';

const {sdkOptions, start, shutdown, autoConfig} = vi.hoisted(() => ({
  sdkOptions: vi.fn(),
  start: vi.fn(),
  shutdown: vi.fn().mockResolvedValue(undefined),
  autoConfig: vi.fn((_config: unknown) => []),
}));
vi.mock('@opentelemetry/sdk-node', () => ({
  NodeSDK: class {
    constructor(options: unknown) {
      sdkOptions(options);
    }
    start() {
      start(process.env.OTEL_LOGS_EXPORTER);
    }
    shutdown = shutdown;
  },
}));
vi.mock('@opentelemetry/auto-instrumentations-node', () => ({getNodeAutoInstrumentations: autoConfig}));

afterEach(() => vi.unstubAllEnvs());

it('registers automatic instrumentation while preserving standard sampling and the logging provider', async () => {
  vi.stubEnv('OTEL_LOGS_EXPORTER', 'otlp');
  setupTracing('backend');
  expect(start).toHaveBeenCalledWith('none');
  expect(process.env.OTEL_LOGS_EXPORTER).toBe('otlp');
  expect(sdkOptions.mock.calls[0][0]).not.toHaveProperty('sampler');
  const config = autoConfig.mock.calls[0][0] as {
    '@opentelemetry/instrumentation-pg': {enhancedDatabaseReporting: boolean};
    '@opentelemetry/instrumentation-ioredis': {dbStatementSerializer: (command: string, args: string[]) => string};
    '@opentelemetry/instrumentation-http': {ignoreIncomingRequestHook: (request: {url: string}) => boolean};
  };
  expect(config['@opentelemetry/instrumentation-pg'].enhancedDatabaseReporting).toBe(false);
  expect(config['@opentelemetry/instrumentation-ioredis'].dbStatementSerializer('GET', ['secret'])).toBe('GET');
  const ignore = config['@opentelemetry/instrumentation-http'].ignoreIncomingRequestHook;
  expect(ignore({url: '/health?detail=1'})).toBe(true);
  expect(ignore({url: '/api/health'})).toBe(false);
  expect(SpanKind.SERVER).toBe(1);
  await shutdownTracing();
  expect(shutdown).toHaveBeenCalledOnce();
});
