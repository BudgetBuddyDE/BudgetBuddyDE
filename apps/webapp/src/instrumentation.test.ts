import {register} from './instrumentation';

afterEach(() => vi.unstubAllEnvs());

it('does not initialize server telemetry without an endpoint', async () => {
  const info = vi.spyOn(console, 'info');
  vi.stubEnv('NEXT_RUNTIME', 'nodejs');
  vi.stubEnv('OTEL_EXPORTER_OTLP_ENDPOINT', '');
  await expect(register()).resolves.toBeUndefined();
  expect(info).not.toHaveBeenCalled();
  info.mockRestore();
});

it('does not initialize Node telemetry in the edge runtime', async () => {
  vi.stubEnv('NEXT_RUNTIME', 'edge');
  vi.stubEnv('OTEL_EXPORTER_OTLP_ENDPOINT', 'https://example.invalid');
  await expect(register()).resolves.toBeUndefined();
});
