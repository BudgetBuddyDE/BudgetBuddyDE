const {sdkShutdown, initializeLogging, shutdownLogging, register, undici} = vi.hoisted(() => ({
  sdkShutdown: vi.fn().mockResolvedValue(undefined),
  initializeLogging: vi.fn(),
  shutdownLogging: vi.fn().mockResolvedValue(undefined),
  register: vi.fn(),
  undici: vi.fn(),
}));

vi.mock('@opentelemetry/sdk-trace-node', () => ({
  NodeTracerProvider: class {
    shutdown = sdkShutdown;
    register = vi.fn();
  },
}));
vi.mock('@budgetbuddyde/logger/node', () => ({initializeLogging, shutdownLogging}));
vi.mock('@opentelemetry/instrumentation', () => ({registerInstrumentations: register}));
vi.mock('@opentelemetry/instrumentation-undici', () => ({
  UndiciInstrumentation: class {
    constructor(config: unknown) {
      undici(config);
    }
  },
}));
vi.mock('@opentelemetry/sdk-trace', () => ({BatchSpanProcessor: class {}}));

beforeEach(() => vi.clearAllMocks());

it('initializes the logger and trace SDK, then coordinates bounded shutdown', async () => {
  vi.stubEnv('OTEL_EXPORTER_OTLP_ENDPOINT', 'http://localhost:4318');
  const {shutdownTelemetry} = await import('./instrumentation.node');

  expect(initializeLogging).toHaveBeenCalledOnce();
  expect(register).toHaveBeenCalledOnce();
  expect(undici).toHaveBeenCalledOnce();
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
  expect(register).not.toHaveBeenCalled();
  vi.unstubAllEnvs();
});
