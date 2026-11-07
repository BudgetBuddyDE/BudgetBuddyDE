import {logs} from '@opentelemetry/api-logs';
import {createLogger} from './logger';
import {initializeLogging} from './node';

const stateKey = Symbol.for('@budgetbuddyde/logger/node-state');
const dispatcherKey = Symbol.for('@budgetbuddyde/logger/dispatcher');

describe('Node logging thresholds', () => {
  const originalEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  const output: string[] = [];
  const exported: string[] = [];
  let originalStdout: NodeJS.WriteStream | undefined;
  let logger: ReturnType<typeof createLogger>;

  beforeEach(() => {
    output.length = 0;
    exported.length = 0;
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT = 'http://localhost:4318';
    (globalThis as any)[stateKey] = undefined;
    originalStdout = console._stdout;
    (console as any)._stdout = undefined;
    vi.spyOn(console, 'log').mockImplementation(message => output.push(String(message)));
    vi.spyOn(logs, 'getLogger').mockReturnValue({emit: record => exported.push(record.severityText ?? '')} as any);
    logger = createLogger();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    (console as any)._stdout = originalStdout;
    (globalThis as any)[stateKey] = undefined;
    (globalThis as any)[dispatcherKey] = undefined;
  });

  afterAll(() => {
    if (originalEndpoint === undefined) delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
    else process.env.OTEL_EXPORTER_OTLP_ENDPOINT = originalEndpoint;
  });

  it.each([
    ['trace', ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR']],
    ['debug', ['DEBUG', 'INFO', 'WARN', 'ERROR']],
    ['info', ['INFO', 'WARN', 'ERROR']],
    ['warn', ['WARN', 'ERROR']],
    ['error', ['ERROR']],
    ['silent', []],
  ] as const)('sends only events at or above %s to console and OTLP', (threshold, expected) => {
    initializeLogging({level: threshold});
    logger.trace('trace');
    logger.debug('debug');
    logger.info('info');
    logger.warn('warn');
    logger.error('error');

    expect(output.map(line => line.match(/\[(TRACE|DEBUG|INFO|WARN|ERROR)\]/)?.[1])).toEqual(expected);
    expect(exported).toEqual(expected);
  });

  it('exports logs using a signal-specific endpoint', () => {
    vi.stubEnv('OTEL_EXPORTER_OTLP_ENDPOINT', '');
    vi.stubEnv('OTEL_EXPORTER_OTLP_LOGS_ENDPOINT', 'http://localhost:4318/v1/logs');
    initializeLogging();
    logger.info('message');
    expect(exported).toEqual(['INFO']);
  });

  it('honors OTEL_LOGS_EXPORTER=none while retaining console output', () => {
    vi.stubEnv('OTEL_LOGS_EXPORTER', 'none');
    initializeLogging();
    logger.info('message');
    expect(exported).toEqual([]);
    expect(output).toHaveLength(1);
  });
});
