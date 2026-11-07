const {setupTracing} = vi.hoisted(() => ({setupTracing: vi.fn()}));
vi.mock('../tracer', () => ({setupTracing}));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.stubEnv('OTEL_EXPORTER_OTLP_ENDPOINT', '');
  vi.stubEnv('OTEL_EXPORTER_OTLP_TRACES_ENDPOINT', '');
  vi.stubEnv('OTEL_EXPORTER_OTLP_PROTOCOL', '');
  vi.stubEnv('OTEL_EXPORTER_OTLP_TRACES_PROTOCOL', '');
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

it('does not start tracing without an endpoint', async () => {
  await import('../tracing-bootstrap');
  expect(setupTracing).not.toHaveBeenCalled();
});
it('starts tracing for a signal-specific endpoint and uses the configured name', async () => {
  vi.stubEnv('OTEL_EXPORTER_OTLP_TRACES_ENDPOINT', 'https://collector.example/v1/traces');
  vi.stubEnv('OTEL_SERVICE_NAME', 'backend-test');
  await import('../tracing-bootstrap');
  expect(setupTracing).toHaveBeenCalledWith('backend-test');
});
it('rejects an unsupported protocol without starting trace export', async () => {
  vi.stubEnv('OTEL_EXPORTER_OTLP_ENDPOINT', 'https://collector.example');
  vi.stubEnv('OTEL_EXPORTER_OTLP_PROTOCOL', 'grpc');
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  await import('../tracing-bootstrap');
  expect(warn).toHaveBeenCalledOnce();
  expect(setupTracing).not.toHaveBeenCalled();
});
