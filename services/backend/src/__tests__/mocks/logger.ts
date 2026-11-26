import {mock, type AnyMock} from './mock';

export type LoggerMock = {
  trace: AnyMock;
  debug: AnyMock;
  info: AnyMock;
  warn: AnyMock;
  error: AnyMock;
  fatal: AnyMock;
  // A plain function, not a mock: production modules bind children while the
  // module graph is evaluated, so `resetAllMocks` must never break `.child`.
  child: (...args: any[]) => LoggerMock;
};

function createLogger(): LoggerMock {
  const logger = {} as LoggerMock;
  logger.trace = mock();
  logger.debug = mock();
  logger.info = mock();
  logger.warn = mock();
  logger.error = mock();
  logger.fatal = mock();
  logger.child = () => logger;
  return logger;
}

export const logger = createLogger();

export function resetLoggerMock(): void {
  for (const value of Object.values(logger)) {
    if (typeof value === 'function' && 'mockReset' in value) (value as AnyMock).mockReset();
  }
}
