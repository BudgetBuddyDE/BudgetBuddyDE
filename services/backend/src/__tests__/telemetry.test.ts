import {otelLogSink, redactText, setupLogs, shutdownTelemetry} from '../telemetry';

const {emit, shutdown, setGlobalLoggerProvider, shutdownTracing} = vi.hoisted(() => ({
  emit: vi.fn(),
  shutdown: vi.fn().mockResolvedValue(undefined),
  setGlobalLoggerProvider: vi.fn(),
  shutdownTracing: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@opentelemetry/api-logs', async importOriginal => ({
  ...(await importOriginal<typeof import('@opentelemetry/api-logs')>()),
  logs: {getLogger: () => ({emit}), setGlobalLoggerProvider},
}));
vi.mock('@opentelemetry/sdk-logs', () => ({
  LoggerProvider: class {
    shutdown = shutdown;
  },
  BatchLogRecordProcessor: class {},
}));
vi.mock('@opentelemetry/exporter-logs-otlp-proto', () => ({OTLPLogExporter: class {}}));
vi.mock('../tracer', () => ({shutdownTracing}));

it('redacts known credentials from text and URL parameters', () => {
  const text = redactText('password=hunter2 token=abc Authorization: Bearer abc123 https://user:pass@example.org');
  expect(text).not.toMatch(/hunter2|abc123|user:pass|token=abc/);
});

it('does not export logs when the provider is disabled', () => {
  emit.mockClear();
  otelLogSink({level: 'info', message: 'local only'});
  expect(emit).not.toHaveBeenCalled();
});

it('exports structured logs without sensitive fields', () => {
  setupLogs('backend');
  otelLogSink({
    level: 'info',
    message: 'token=secret',
    authorization: 'Bearer secret',
    userId: 'user-1',
    nested: {password: 'hidden', detail: 'api_key=private'},
  });
  expect(emit).toHaveBeenCalledWith(
    expect.objectContaining({
      body: 'token=[REDACTED]',
      attributes: {
        authorization: '[REDACTED]',
        userId: 'user-1',
        nested: '{"password":"[REDACTED]","detail":"api_key=[REDACTED]"}',
      },
    }),
  );
});

it('flushes both providers on shutdown', async () => {
  await shutdownTelemetry();
  expect(shutdown).toHaveBeenCalled();
  expect(shutdownTracing).toHaveBeenCalled();
});

it('does not propagate exporter failures during shutdown', async () => {
  shutdown.mockRejectedValueOnce(new Error('collector unavailable'));
  shutdownTracing.mockRejectedValueOnce(new Error('collector unavailable'));
  await expect(shutdownTelemetry()).resolves.toBeUndefined();
});
