import type {LogEvent, LogSink} from '@budgetbuddyde/logger';

// Symbol.for shares the sink across independently bundled server modules, without importing Node-only code into clients.
const sinkKey = Symbol.for('budgetbuddyde.webapp.otel.logSink');
type SinkRegistry = typeof globalThis & {[sinkKey]?: LogSink};

export function registerServerLogSink(sink: LogSink): void {
  if (typeof window === 'undefined') (globalThis as SinkRegistry)[sinkKey] = sink;
}

export function forwardServerLog(event: LogEvent): void {
  if (typeof window !== 'undefined') return;
  try {
    (globalThis as SinkRegistry)[sinkKey]?.(event);
  } catch {
    // Telemetry must never interfere with normal application logging.
  }
}
