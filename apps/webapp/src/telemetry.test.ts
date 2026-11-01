import {forwardServerLog, registerServerLogSink} from './telemetry-sink';
import {otelLogSink, redactText} from './telemetry.node';

const {emit} = vi.hoisted(() => ({emit: vi.fn()}));
vi.mock('@opentelemetry/api-logs', async importOriginal => ({
  ...(await importOriginal<typeof import('@opentelemetry/api-logs')>()),
  logs: {getLogger: () => ({emit})},
}));

afterEach(() => {
  vi.unstubAllGlobals();
  delete (globalThis as Record<symbol, unknown>)[Symbol.for('budgetbuddyde.webapp.otel.logSink')];
  vi.clearAllMocks();
});

it('does not forward browser log events', () => {
  const sink = vi.fn();
  vi.stubGlobal('window', undefined);
  registerServerLogSink(sink);
  vi.stubGlobal('window', {});
  forwardServerLog({level: 'info', message: 'browser'});
  expect(sink).not.toHaveBeenCalled();
});

it('forwards server log events and tolerates sink failures', () => {
  vi.stubGlobal('window', undefined);
  const sink = vi.fn().mockImplementation(() => {
    throw new Error('export failed');
  });
  registerServerLogSink(sink);
  expect(() => forwardServerLog({level: 'info', message: 'server'})).not.toThrow();
  expect(sink).toHaveBeenCalledOnce();
});

it('redacts known credentials while preserving ordinary structured metadata', () => {
  expect(redactText('password=hunter2 token=abc Authorization: Bearer abc123')).not.toMatch(/hunter2|abc123|token=abc/);
  expect(redactText('Cookie: first=abc; second=private')).not.toMatch(/abc|private/);
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
