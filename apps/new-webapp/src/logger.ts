type LogContext = Record<string, boolean | number | string | null | undefined>;

function write(level: 'error' | 'info' | 'warn', message: string, context?: LogContext) {
  const safeContext = context
    ? Object.fromEntries(Object.entries(context).filter(([key]) => !/token|key|secret|password/i.test(key)))
    : undefined;
  console[level](`[new-webapp] ${message}`, safeContext ?? '');
}

export const logger = {
  error: (message: string, context?: LogContext) => write('error', message, context),
  info: (message: string, context?: LogContext) => write('info', message, context),
  warn: (message: string, context?: LogContext) => write('warn', message, context),
};
