import {sanitizeSpan} from '@budgetbuddyde/core/telemetry/sanitizeSpan';
import {getLogLevel} from '@budgetbuddyde/logger';
import {initializeLogging, shutdownLogging} from '@budgetbuddyde/logger/node';
import {getNodeAutoInstrumentations} from '@opentelemetry/auto-instrumentations-node';
import {OTLPTraceExporter} from '@opentelemetry/exporter-trace-otlp-proto';
import {defaultResource, envDetector, resourceFromAttributes} from '@opentelemetry/resources';
import {NodeSDK} from '@opentelemetry/sdk-node';
import {BatchSpanProcessor, type SpanExporter} from '@opentelemetry/sdk-trace';
import {ATTR_SERVICE_NAME} from '@opentelemetry/semantic-conventions';
import {name} from '../package.json';
import {webappConfig} from './config';

const backendOrigin = new URL(webappConfig.backendServiceHost).origin;
const stateKey = Symbol.for('@budgetbuddyde/webapp/telemetry');
type TelemetryGlobal = typeof globalThis & {
  [stateKey]?: {sdk?: NodeSDK; shutdown?: Promise<void>; hooksInstalled?: boolean};
};
const state = ((globalThis as TelemetryGlobal)[stateKey] ??= {});
const service = process.env.OTEL_SERVICE_NAME?.trim() || name;
const endpoint =
  process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT?.trim() || process.env.OTEL_EXPORTER_OTLP_ENDPOINT?.trim();
const protocol =
  process.env.OTEL_EXPORTER_OTLP_TRACES_PROTOCOL?.trim() || process.env.OTEL_EXPORTER_OTLP_PROTOCOL?.trim();
if (endpoint && protocol && protocol !== 'http/protobuf') {
  console.warn('OTLP trace export supports only http/protobuf; trace export is disabled.');
}
if (!state.sdk && endpoint && (!protocol || protocol === 'http/protobuf')) {
  const exporter = new OTLPTraceExporter();
  const safeExporter: SpanExporter = {
    export: (spans, callback) => exporter.export(spans.map(sanitizeSpan), callback),
    shutdown: () => exporter.shutdown(),
    forceFlush: () => exporter.forceFlush(),
  };
  const sdk = new NodeSDK({
    resource: defaultResource().merge(resourceFromAttributes({[ATTR_SERVICE_NAME]: service})),
    resourceDetectors: [envDetector],
    metricReaders: [],
    spanProcessors:
      process.env.OTEL_TRACES_EXPORTER === 'none' ? [] : [new BatchSpanProcessor({exporter: safeExporter})],
    instrumentations: [
      getNodeAutoInstrumentations({
        // Next.js owns inbound routing spans; avoid duplicate HTTP and Express spans.
        '@opentelemetry/instrumentation-http': {enabled: false},
        '@opentelemetry/instrumentation-express': {enabled: false},
        '@opentelemetry/instrumentation-undici': {
          ignoreRequestHook: request => new URL(request.origin).origin !== backendOrigin,
        },
      }),
    ],
  });
  const previousLogsExporter = process.env.OTEL_LOGS_EXPORTER;
  process.env.OTEL_LOGS_EXPORTER = 'none';
  try {
    sdk.start();
    state.sdk = sdk;
  } finally {
    if (previousLogsExporter === undefined) delete process.env.OTEL_LOGS_EXPORTER;
    else process.env.OTEL_LOGS_EXPORTER = previousLogsExporter;
  }
}
initializeLogging({context: {service}, level: webappConfig.log.level ?? getLogLevel(process.env.LOG_LEVEL)});

export function shutdownTelemetry(): Promise<void> {
  if (!state.shutdown) {
    state.shutdown = Promise.race([
      Promise.allSettled([state.sdk?.shutdown(), shutdownLogging()]).then(() => undefined),
      new Promise<void>(resolve => {
        const timer = setTimeout(resolve, 5000);
        timer.unref();
      }),
    ]);
  }
  return state.shutdown;
}

if (!state.hooksInstalled) {
  state.hooksInstalled = true;
  process.once('SIGTERM', () => void shutdownTelemetry());
  process.once('SIGINT', () => void shutdownTelemetry());
  process.once('beforeExit', () => void shutdownTelemetry());
}
