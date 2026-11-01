import type {LogEvent} from '@budgetbuddyde/logger';
import {logs, SeverityNumber} from '@opentelemetry/api-logs';

const REDACTED = '[REDACTED]';
const sensitiveKey = /password|passwd|secret|token|authorization|api[-_.]?key|cookie|credential/i;
const severity: Record<LogEvent['level'], SeverityNumber> = {
  trace: SeverityNumber.TRACE,
  debug: SeverityNumber.DEBUG,
  info: SeverityNumber.INFO,
  warn: SeverityNumber.WARN,
  error: SeverityNumber.ERROR,
};

export function redactText(value: string): string {
  return value
    .replace(/\b((?:set-)?cookie|authorization)\s*:\s*[^\r\n]*/gi, `$1: ${REDACTED}`)
    .replace(/\b(Bearer|Basic)\s+[A-Za-z0-9+/=_%-]+/gi, `$1 ${REDACTED}`)
    .replace(/(https?:\/\/)[^\s/@:]+:[^\s/@]+@/gi, `$1${REDACTED}@`)
    .replace(
      /((?:["']?)(?:password|passwd|secret|[\w.-]*token|authorization|api[-_.]?key|cookie|credential)(?:["']?)\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s&,;}]+)/gi,
      `$1${REDACTED}`,
    );
}

function sanitize(value: unknown, seen = new WeakSet<object>(), depth = 0): unknown {
  if (typeof value === 'string') return redactText(value);
  if (typeof value === 'bigint') return value.toString();
  if (value === null || typeof value !== 'object') return value;
  if (depth > 8 || seen.has(value)) return '[Circular or too deep]';
  seen.add(value);
  if (value instanceof Error)
    return {name: value.name, message: redactText(value.message), stack: redactText(value.stack ?? '')};
  if (Array.isArray(value)) return value.map(item => sanitize(item, seen, depth + 1));
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      sensitiveKey.test(key) ? REDACTED : sanitize(item, seen, depth + 1),
    ]),
  );
}

export function otelLogSink(event: LogEvent): void {
  try {
    const {level, message, ...context} = event;
    const attributes: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(context)) {
      const safe = sensitiveKey.test(key) ? REDACTED : sanitize(value);
      if (typeof safe === 'string' || typeof safe === 'number' || typeof safe === 'boolean') attributes[key] = safe;
      else if (safe !== undefined) attributes[key] = JSON.stringify(safe);
    }
    logs.getLogger('budgetbuddyde.webapp').emit({
      severityNumber: severity[level],
      severityText: level.toUpperCase(),
      body: redactText(message),
      attributes,
    });
  } catch {
    // Export failures must not break requests.
  }
}
