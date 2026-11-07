const {sdkOptions, sdkStart, sdkShutdown, initializeLogging, shutdownLogging, autoConfig} = vi.hoisted(() => ({
  sdkOptions: vi.fn(),
  sdkStart: vi.fn(),
  sdkShutdown: vi.fn().mockResolvedValue(undefined),
  initializeLogging: vi.fn(),
  shutdownLogging: vi.fn().mockResolvedValue(undefined),
  autoConfig: vi.fn((_config: unknown) => []),
}));
vi.mock('@opentelemetry/sdk-node', () => ({
  NodeSDK: class {
    constructor(options: unknown) {
      sdkOptions(options);
    }
    start = sdkStart;
    shutdown = sdkShutdown;
  },
}));
vi.mock('@budgetbuddyde/logger/node', () => ({initializeLogging, shutdownLogging}));
vi.mock('@opentelemetry/auto-instrumentations-node', () => ({getNodeAutoInstrumentations: autoConfig}));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  delete (globalThis as Record<symbol, unknown>)[Symbol.for('@budgetbuddyde/webapp/telemetry')];
});
afterEach(() => vi.unstubAllEnvs());

it('initializes one SDK even when loaded repeatedly and coordinates shutdown', async () => {
  vi.stubEnv('OTEL_EXPORTER_OTLP_ENDPOINT', 'http://localhost:4318');
  const {shutdownTelemetry} = await import('./instrumentation.node');
  vi.resetModules();
  await import('./instrumentation.node');
  expect(initializeLogging).toHaveBeenCalled();
  expect(sdkStart).toHaveBeenCalledOnce();
  const config = autoConfig.mock.calls[0][0] as {
    '@opentelemetry/instrumentation-http': {enabled: boolean};
    '@opentelemetry/instrumentation-undici': {ignoreRequestHook: (request: {origin: string}) => boolean};
  };
  expect(config['@opentelemetry/instrumentation-http'].enabled).toBe(false);
  expect(config['@opentelemetry/instrumentation-undici'].ignoreRequestHook({origin: 'https://outside.example'})).toBe(
    true,
  );
  await shutdownTelemetry();
  await shutdownTelemetry();
  expect(shutdownLogging).toHaveBeenCalledOnce();
  expect(sdkShutdown).toHaveBeenCalledOnce();
});

it('initializes logging without starting trace export when no endpoint is configured', async () => {
  vi.stubEnv('OTEL_EXPORTER_OTLP_ENDPOINT', '');
  vi.stubEnv('OTEL_EXPORTER_OTLP_TRACES_ENDPOINT', '');
  await import('./instrumentation.node');
  expect(initializeLogging).toHaveBeenCalledOnce();
  expect(sdkStart).not.toHaveBeenCalled();
});

it('accepts a signal-specific trace endpoint', async () => {
  vi.stubEnv('OTEL_EXPORTER_OTLP_ENDPOINT', '');
  vi.stubEnv('OTEL_EXPORTER_OTLP_TRACES_ENDPOINT', 'http://localhost:4318/v1/traces');
  await import('./instrumentation.node');
  expect(sdkStart).toHaveBeenCalledOnce();
});
