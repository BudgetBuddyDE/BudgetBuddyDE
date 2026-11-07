import {sanitizeSpan} from '@budgetbuddyde/core/telemetry/sanitizeSpan';
import {trace} from '@opentelemetry/api';
import {getNodeAutoInstrumentations} from '@opentelemetry/auto-instrumentations-node';
import {OTLPTraceExporter} from '@opentelemetry/exporter-trace-otlp-proto';
import {defaultResource, envDetector, resourceFromAttributes} from '@opentelemetry/resources';
import {NodeSDK} from '@opentelemetry/sdk-node';
import {BatchSpanProcessor, type SpanExporter} from '@opentelemetry/sdk-trace';
import {ATTR_SERVICE_NAME} from '@opentelemetry/semantic-conventions';

let sdk: NodeSDK | undefined;

export function setupTracing(serviceName: string, traceExporter?: SpanExporter) {
  if (sdk) return trace.getTracer(serviceName);
  const exporter = traceExporter ?? new OTLPTraceExporter();
  const safeExporter: SpanExporter = {
    export: (spans, callback) => exporter.export(spans.map(sanitizeSpan), callback),
    shutdown: () => exporter.shutdown(),
    forceFlush: () => exporter.forceFlush?.() ?? Promise.resolve(),
  };
  sdk = new NodeSDK({
    resource: defaultResource().merge(resourceFromAttributes({[ATTR_SERVICE_NAME]: serviceName})),
    resourceDetectors: [envDetector],
    metricReaders: [],
    spanProcessors:
      process.env.OTEL_TRACES_EXPORTER === 'none' ? [] : [new BatchSpanProcessor({exporter: safeExporter})],
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-http': {
          ignoreIncomingRequestHook: request => request.url?.split('?')[0] === '/health',
        },
        '@opentelemetry/instrumentation-pg': {enhancedDatabaseReporting: false},
        '@opentelemetry/instrumentation-ioredis': {dbStatementSerializer: command => command},
      }),
    ],
  });
  // The shared logger owns log export; prevent the Node SDK installing a second provider.
  const previousLogsExporter = process.env.OTEL_LOGS_EXPORTER;
  process.env.OTEL_LOGS_EXPORTER = 'none';
  try {
    sdk.start();
  } finally {
    if (previousLogsExporter === undefined) delete process.env.OTEL_LOGS_EXPORTER;
    else process.env.OTEL_LOGS_EXPORTER = previousLogsExporter;
  }
  return trace.getTracer(serviceName);
}

export async function shutdownTracing(): Promise<void> {
  await sdk?.shutdown();
}
