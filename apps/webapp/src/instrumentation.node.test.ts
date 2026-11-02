const {start, sdkShutdown, initializeLogging, shutdownLogging} = vi.hoisted(() => ({
  start: vi.fn(),
  sdkShutdown: vi.fn().mockResolvedValue(undefined),
  initializeLogging: vi.fn(),
  shutdownLogging: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@opentelemetry/sdk-node', () => ({
  NodeSDK: class {
    start = start;
    shutdown = sdkShutdown;
  },
}));
vi.mock('@budgetbuddyde/logger/node', () => ({initializeLogging, shutdownLogging}));

beforeEach(() => vi.clearAllMocks());

it('initializes the logger and trace SDK, then coordinates bounded shutdown', async () => {
  vi.stubEnv('OTEL_EXPORTER_OTLP_ENDPOINT', 'http://localhost:4318');
  const {shutdownTelemetry} = await import('./instrumentation.node');

  expect(initializeLogging).toHaveBeenCalledOnce();
  expect(start).toHaveBeenCalledOnce();
  await shutdownTelemetry();
  await shutdownTelemetry();
  expect(shutdownLogging).toHaveBeenCalledOnce();
  expect(sdkShutdown).toHaveBeenCalledOnce();
  vi.unstubAllEnvs();
});

it('initializes logging without starting trace export when no endpoint is configured', async () => {
  vi.resetModules();
  vi.stubEnv('OTEL_EXPORTER_OTLP_ENDPOINT', '');
  await import('./instrumentation.node');
  expect(initializeLogging).toHaveBeenCalledOnce();
  expect(start).not.toHaveBeenCalled();
  vi.unstubAllEnvs();
});
