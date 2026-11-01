const {start, shutdown, registerSink} = vi.hoisted(() => ({
  start: vi.fn(),
  shutdown: vi.fn(),
  registerSink: vi.fn(),
}));

vi.mock('@opentelemetry/sdk-node', () => ({
  NodeSDK: class {
    start = start;
    shutdown = shutdown;
  },
}));
vi.mock('@opentelemetry/exporter-logs-otlp-proto', () => ({OTLPLogExporter: class {}}));
vi.mock('@opentelemetry/exporter-trace-otlp-proto', () => ({OTLPTraceExporter: class {}}));
vi.mock('@opentelemetry/sdk-logs', () => ({BatchLogRecordProcessor: class {}}));
vi.mock('@opentelemetry/sdk-trace-node', () => ({BatchSpanProcessor: class {}}));
vi.mock('./telemetry-sink', () => ({registerServerLogSink: registerSink}));

it('starts once and tolerates exporter failure during bounded shutdown', async () => {
  shutdown.mockRejectedValueOnce(new Error('collector unavailable'));
  const once = vi.spyOn(process, 'once').mockReturnValue(process);
  const {shutdownTelemetry} = await import('./instrumentation.node');
  expect(start).toHaveBeenCalledOnce();
  expect(registerSink).toHaveBeenCalledOnce();
  await expect(shutdownTelemetry()).resolves.toBeUndefined();
  await expect(shutdownTelemetry()).resolves.toBeUndefined();
  expect(shutdown).toHaveBeenCalledOnce();
  expect(once).toHaveBeenCalledTimes(3);
  once.mockRestore();
});

it('finishes shutdown when the exporter never responds', async () => {
  vi.resetModules();
  vi.useFakeTimers();
  shutdown.mockImplementationOnce(() => new Promise<void>(() => undefined));
  const once = vi.spyOn(process, 'once').mockReturnValue(process);
  const {shutdownTelemetry} = await import('./instrumentation.node');
  const done = shutdownTelemetry();
  await vi.advanceTimersByTimeAsync(5000);
  await expect(done).resolves.toBeUndefined();
  once.mockRestore();
  vi.useRealTimers();
});
