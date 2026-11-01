import type {LogEvent} from '@budgetbuddyde/logger';
import {logs, SeverityNumber} from '@opentelemetry/api-logs';
import {OTLPLogExporter} from '@opentelemetry/exporter-logs-otlp-proto';
import {resourceFromAttributes} from '@opentelemetry/resources';
import {BatchLogRecordProcessor, LoggerProvider} from '@opentelemetry/sdk-logs';
import {ATTR_SERVICE_NAME} from '@opentelemetry/semantic-conventions';
import {shutdownTracing} from './tracer';

const REDACTED = '[REDACTED]';
const sensitiveKey = /password|passwd|secret|token|authorization|api[-_.]?key|cookie|credential/i;
const severity: Record<LogEvent['level'], SeverityNumber> = {
  trace: SeverityNumber.TRACE,
  debug: SeverityNumber.DEBUG,
  info: SeverityNumber.INFO,
  warn: SeverityNumber.WARN,
  error: SeverityNumber.ERROR,
};
let provider: LoggerProvider | undefined;

/** Scrubs recognizable credentials in free text; arbitrary secrets cannot be identified reliably. */
export function redactText(value: string): string {
  return value
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

/** Retains structured context while ensuring unsupported values and errors cannot break logging. */
export function otelLogSink(event: LogEvent): void {
  if (!provider) return;
  try {
    const {level, message, ...context} = event;
    const attributes: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(context)) {
      const safe = sensitiveKey.test(key) ? REDACTED : sanitize(value);
      if (typeof safe === 'string' || typeof safe === 'number' || typeof safe === 'boolean') attributes[key] = safe;
      else if (safe !== undefined) attributes[key] = JSON.stringify(safe);
    }
    logs.getLogger('budgetbuddyde.backend').emit({
      severityNumber: severity[level],
      severityText: level.toUpperCase(),
      body: redactText(message),
      attributes,
    });
  } catch {
    // Telemetry must not break application logging or request handling.
  }
}

export function setupLogs(serviceName: string): void {
  if (provider) return;
  provider = new LoggerProvider({
    resource: resourceFromAttributes({[ATTR_SERVICE_NAME]: serviceName}),
    processors: [new BatchLogRecordProcessor({exporter: new OTLPLogExporter()})],
  });
  logs.setGlobalLoggerProvider(provider);
}

/** Limit shutdown latency if an exporter is unreachable. */
export async function shutdownTelemetry(): Promise<void> {
  const timeout = new Promise<void>(resolve => {
    const timer = setTimeout(resolve, 5000);
    timer.unref();
  });
  await Promise.race([Promise.allSettled([shutdownTracing(), provider?.shutdown()]).then(() => undefined), timeout]);
}
