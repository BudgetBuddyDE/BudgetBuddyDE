import {context, trace} from '@opentelemetry/api';
import {logs, SeverityNumber} from '@opentelemetry/api-logs';
import {OTLPLogExporter} from '@opentelemetry/exporter-logs-otlp-proto';
import {defaultResource, detectResources, envDetector, resourceFromAttributes} from '@opentelemetry/resources';
import {BatchLogRecordProcessor, LoggerProvider} from '@opentelemetry/sdk-logs';
import {ATTR_SERVICE_NAME} from '@opentelemetry/semantic-conventions';
import winston from 'winston';
import {registerLoggerDispatcher} from './logger';
import {redactText} from './normalizer';
import type {LogEvent, LogThreshold, ServiceContext} from './types';

export interface LoggingOptions {
  context?: ServiceContext;
  level?: LogThreshold;
}

const levels = {error: 0, warn: 1, info: 2, debug: 3, trace: 4};
const severity: Record<LogEvent['level'], SeverityNumber> = {
  trace: SeverityNumber.TRACE,
  debug: SeverityNumber.DEBUG,
  info: SeverityNumber.INFO,
  warn: SeverityNumber.WARN,
  error: SeverityNumber.ERROR,
};
interface NodeLoggerState {
  initialized: boolean;
  provider?: LoggerProvider;
  shutdownPromise?: Promise<void>;
}

const stateKey = Symbol.for('@budgetbuddyde/logger/node-state');
type LoggerGlobal = typeof globalThis & {[stateKey]?: NodeLoggerState};

function getState(): NodeLoggerState {
  const target = globalThis as LoggerGlobal;
  target[stateKey] ??= {initialized: false};
  return target[stateKey];
}

function safeAttributes(event: LogEvent): Record<string, string | number | boolean> {
  const attributes: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(event)) {
    if (key === 'level' || key === 'message' || key === 'error') continue;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') attributes[key] = value;
    else if (value !== undefined) {
      try {
        attributes[key] = JSON.stringify(value);
      } catch {
        attributes[key] = '[Unserializable]';
      }
    }
  }
  return attributes;
}

/** Initializes the shared Winston pipeline and optional OTLP export. Safe to call from each Node bundle. */
export function initializeLogging(options: LoggingOptions = {}): void {
  const state = getState();
  if (state.initialized) return;
  state.initialized = true;
  const endpoint =
    process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT?.trim() || process.env.OTEL_EXPORTER_OTLP_ENDPOINT?.trim();
  const protocol =
    process.env.OTEL_EXPORTER_OTLP_LOGS_PROTOCOL?.trim() || process.env.OTEL_EXPORTER_OTLP_PROTOCOL?.trim();
  if (endpoint && protocol && protocol !== 'http/protobuf') {
    console.warn('OTLP log export supports only http/protobuf; log export is disabled.');
  }
  if (
    endpoint &&
    (!protocol || protocol === 'http/protobuf') &&
    process.env.OTEL_LOGS_EXPORTER !== 'none' &&
    process.env.OTEL_SDK_DISABLED !== 'true'
  ) {
    try {
      const serviceName = process.env.OTEL_SERVICE_NAME?.trim() || options.context?.service || 'budgetbuddyde';
      state.provider = new LoggerProvider({
        resource: defaultResource()
          .merge(resourceFromAttributes({[ATTR_SERVICE_NAME]: serviceName}))
          .merge(detectResources({detectors: [envDetector]})),
        processors: [new BatchLogRecordProcessor({exporter: new OTLPLogExporter()})],
      });
      logs.setGlobalLoggerProvider(state.provider);
    } catch {
      state.provider = undefined;
    }
  }

  const threshold = options.level ?? 'info';
  const thresholdPriority = threshold === 'silent' ? Number.POSITIVE_INFINITY : levels[threshold];
  const appLogger = winston.createLogger({
    levels,
    level: threshold === 'silent' ? 'error' : threshold,
    silent: threshold === 'silent',
    format: winston.format.printf(info => {
      const event = info.event as LogEvent | undefined;
      if (!event) return '';
      if (state.provider) {
        try {
          const spanContext = trace.getActiveSpan()?.spanContext();
          const attributes = safeAttributes(event);
          if (spanContext) {
            attributes.trace_id = spanContext.traceId;
            attributes.span_id = spanContext.spanId;
          }
          logs.getLogger('budgetbuddyde').emit({
            severityNumber: severity[event.level],
            severityText: event.level.toUpperCase(),
            body: redactText(event.message),
            attributes,
            context: context.active(),
          });
        } catch {
          // Export errors must not interrupt application work.
        }
      }
      const {level, message, error, ...metadata} = event;
      let details = '';
      try {
        details = JSON.stringify(metadata);
      } catch {
        details = '[Unserializable]';
      }
      return `${new Date().toISOString()} [${level.toUpperCase()}] ${message} - ${details}${error?.stack ? `\n${error.stack}` : ''}`;
    }),
    transports: [new winston.transports.Console()],
  });
  registerLoggerDispatcher(event => {
    if (levels[event.level] > thresholdPriority) return;
    try {
      appLogger.log({level: event.level, message: event.message, event});
    } catch {
      // Export and console failures must not interrupt requests or rendering.
    }
  });
}

/** Flushes log records once, with a maximum five-second wait. */
export function shutdownLogging(): Promise<void> {
  const state = getState();
  if (!state.shutdownPromise) {
    const timeout = new Promise<void>(resolve => {
      const timer = setTimeout(resolve, 5000);
      timer.unref?.();
    });
    state.shutdownPromise = Promise.race([
      state.provider?.shutdown().catch(() => undefined) ?? Promise.resolve(),
      timeout,
    ]);
  }
  return state.shutdownPromise;
}
